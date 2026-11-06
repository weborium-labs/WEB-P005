import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Pinned so the backend CORS allowlist (FRONTEND_URLS) and the
    // ADMIN_URL OAuth redirect target always match the admin origin.
    port: 5174,
    strictPort: true,
  },
});
