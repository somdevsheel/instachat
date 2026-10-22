import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Content-Security-Policy for the production build (dev needs inline
 * scripts for HMR, so it's only applied on `vite build`).
 *
 * Built from env so it lists exactly the origins this deployment uses:
 *   VITE_API_URL        REST API            (required)
 *   VITE_SOCKET_URL     Socket.IO           (defaults to the API origin)
 *   VITE_CDN_URL        media (CloudFront)  (required)
 *   VITE_S3_BUCKET_URL  presigned uploads + legacy media URLs (required)
 *
 * Effect: scripts only from this origin (no inline, no eval, Trusted
 * Types enforced), network only to the API/socket and YOUR bucket,
 * images/video only from your CDN/bucket. An injected script can't
 * run, and couldn't load remote code or send a token elsewhere.
 * (frame-ancestors can't be set via <meta>; nginx sends it.)
 */
const originOf = (url) => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

const buildCsp = (env) => {
  const api = originOf(env.VITE_API_URL || '');
  const socket = originOf(env.VITE_SOCKET_URL || '') || api;
  const cdn = originOf(env.VITE_CDN_URL || '');
  const bucket = originOf(env.VITE_S3_BUCKET_URL || '');

  const missing = [
    !api && 'VITE_API_URL',
    !cdn && 'VITE_CDN_URL',
    !bucket && 'VITE_S3_BUCKET_URL',
  ].filter(Boolean);
  if (missing.length) {
    // Without these the CSP would block the app's own API/media, so a
    // production build would be broken — fail loudly instead.
    throw new Error(
      `Production build needs ${missing.join(', ')} (see frontend/web/.env.example)`
    );
  }

  const unique = (list) => [...new Set(list.filter(Boolean))].join(' ');
  const media = unique([cdn, bucket]);
  const directives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: ${media}`,
    `media-src 'self' blob: ${media}`,
    `connect-src ${unique(["'self'", api, socket, socket && socket.replace(/^http/, 'ws'), bucket])}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "require-trusted-types-for 'script'",
  ];
  if (api.startsWith('https:')) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
};

const cspPlugin = (env) => ({
  name: 'inject-csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace(
      '<meta charset="UTF-8" />',
      `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${buildCsp(env)}" />`
    ),
});

export default defineConfig(({ mode }) => ({
  plugins: [react(), cspPlugin(loadEnv(mode, __dirname, 'VITE_'))],
  resolve: {
    alias: {
      // frontend/shared (Storage, storySlice) imports this RN-only
      // package directly. This app is plain web, so every import of it
      // resolves to a localStorage-backed shim instead — see
      // src/shims/asyncStorageShim.js.
      '@react-native-async-storage/async-storage': path.resolve(
        __dirname,
        'src/shims/asyncStorageShim.js'
      ),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
}));
