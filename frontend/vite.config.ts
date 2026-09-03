import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ["primeform-vmc-frontend-production.up.railway.app"],
  },
});