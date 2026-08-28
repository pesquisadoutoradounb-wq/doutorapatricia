import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// O site é servido em https://pesquisadoutoradounb-wq.github.io/doutorapatricia/
// Portanto o base precisa ser o nome do repositório. Sobrescrevível via VITE_APP_BASE_PATH.
const basePath = process.env.VITE_APP_BASE_PATH ?? "/doutorapatricia/";

export default defineConfig({
  base: basePath,
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
