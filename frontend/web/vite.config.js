import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
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
});
