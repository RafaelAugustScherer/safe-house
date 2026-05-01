import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy Socket.IO + REST through Vite to the API server in dev.
      "/socket.io": { target: "http://localhost:4000", ws: true, changeOrigin: true },
      "/health": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
  build: {
    outDir: "build",
    sourcemap: true,
  },
});
