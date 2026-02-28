import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    // Let Vite use default esbuild minification (fast + stable)
    minify: true,

    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
          animations: ["framer-motion"],
          icons: ["lucide-react"],
        },
      },
    },

    chunkSizeWarningLimit: 1000,
    sourcemap: false,
  },
});
