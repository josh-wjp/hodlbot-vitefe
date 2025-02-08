import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    watch: {
      ignored: ['**/.idea/**'],
    },
  },
  define: {
    global: 'window', // Polyfill global for browser compatibility
  },
});
