import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    env: {
      VITE_SUPABASE_URL: "http://localhost:54321",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
      VITE_APP_BASE_URL: "https://pesquisadoutoradounb-wq.github.io/doutorapatricia",
      VITE_APP_BASE_PATH: "/doutorapatricia/",
      VITE_STUDY_MODE: "piloto",
    },
    // Os testes de RLS falam com um Supabase local real; rode-os com `npm run test:rls`
    // depois de `supabase start`. Eles são pulados automaticamente se SUPABASE_TEST_URL
    // não estiver definido.
  },
});
