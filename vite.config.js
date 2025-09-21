// vite.config.js
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  base: "/gismap-project/", // Set base path for GitHub Pages
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3003,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
})
