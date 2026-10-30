import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Göreli adresler: site hem kullanıcı.github.io/veteran-image-creator/ hem de kendi alan adında çalışır
export default defineConfig({
  base: "./",
  plugins: [react()],
});
