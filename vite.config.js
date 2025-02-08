import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills'; // CORRECT IMPORT

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true, // Enable polyfills for global and buffer
    }),
  ],
  resolve: {
    alias: {
      buffer: 'buffer', // Alias buffer to the browser-compatible polyfill
    },
  },
  optimizeDeps: {
    include: ['buffer'], // Pre-bundle buffer
  },
});
