import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Content-Security-Policy for the production build (dev needs inline
 * scripts for HMR, so it's only applied on `vite build`).
 * Scripts only from this origin (no inline, no eval, Trusted Types
 * enforced) and network only to this origin's /api — so even an
 * injected script couldn't run, load remote code, or send the admin
 * token elsewhere. Media only from your CDN/bucket:
 *   VITE_CDN_URL        (required)
 *   VITE_S3_BUCKET_URL  (optional: legacy media URLs)
 * (frame-ancestors can't be set via <meta>; nginx sends it.)
 */
const originOf = (url: string) => {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

const buildCsp = (env: Record<string, string>) => {
  const cdn = originOf(env.VITE_CDN_URL || '')
  if (!cdn) {
    throw new Error('Production build needs VITE_CDN_URL (see admin-panel/.env.example)')
  }
  const media = [...new Set([cdn, originOf(env.VITE_S3_BUCKET_URL || '')].filter(Boolean))].join(' ')
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: ${media}`,
    `media-src 'self' blob: ${media}`,
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "require-trusted-types-for 'script'",
  ].join('; ')
}

const cspPlugin = (env: Record<string, string>): Plugin => ({
  name: 'inject-csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace(
      '<meta charset="UTF-8" />',
      `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${buildCsp(env)}" />`
    ),
})

export default defineConfig(({ mode }) => ({
  plugins: [react(), cspPlugin(loadEnv(mode, process.cwd(), 'VITE_'))],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Your backend URL
        changeOrigin: true,
      },
    },
  },
}))
