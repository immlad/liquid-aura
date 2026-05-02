import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  // REQUIRED for GitHub Pages + jsDelivr
  // Ensures all assets load correctly from /docs or CDN
  base: "./",

  server: {
    host: "::",     // IPv6 support
    port: 8080,
    hmr: {
      overlay: false,
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core"
    ],
  },

  build: {
    outDir: "dist",     // Vite default (you will rename to /docs)
    emptyOutDir: true,
    sourcemap: false,
  }
}));