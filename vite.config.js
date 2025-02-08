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
      buffer: "buffer", // Alias buffer to the browser-compatible polyfill
    },
  },
  optimizeDeps: {
    include: ["buffer"], // Pre-bundle buffer
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
    outDir: "dist", // Azure expects this folder for the build
    emptyOutDir: true,
    sourcemap: false, // Disable source maps for production
  },
});
