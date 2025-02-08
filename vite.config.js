import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true, // Enable polyfills for global and buffer
    }),
  ],
  resolve: {
    alias: {
      crypto: "crypto-browserify", // Alias crypto to the browser-compatible polyfill
      buffer: "buffer", // Alias buffer to the browser-compatible polyfill
    },
  },
  optimizeDeps: {
    include: ["crypto-browserify", "buffer"], // Pre-bundle crypto-browserify
  },
  server: {
    proxy: {
      "/api": {
        target: "https://app.mynearwallet.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    rollupOptions: {
      input: "./src/main.jsx",
    },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
