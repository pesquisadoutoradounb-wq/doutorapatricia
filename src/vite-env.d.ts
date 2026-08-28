/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_BASE_URL: string;
  readonly VITE_APP_BASE_PATH: string;
  readonly VITE_STUDY_MODE: "piloto" | "producao";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
