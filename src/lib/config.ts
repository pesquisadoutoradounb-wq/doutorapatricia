/**
 * Configuração central do estudo.
 *
 * Regras importantes:
 * - NENHUM texto de instrumento (TCLE, vinhetas, questionários, avaliação,
 *   encerramento) vive aqui nem em qualquer lugar do bundle. Esse conteúdo é
 *   pré-CEP e sensível a efeito de expectativa; fica apenas no Supabase e é
 *   buscado em runtime com sessão de participante válida.
 * - Aqui ficam somente parâmetros de infraestrutura e de apresentação.
 */

export type StudyMode = "piloto" | "producao";

export type IdentidadeVisual = "unb" | "vivant" | "neutra";

function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    // Em dev isso ajuda a detectar .env.local ausente cedo.
    console.warn(`[config] Variável de ambiente ausente: ${name}`);
  }
  return value ?? "";
}

export const config = {
  supabaseUrl: requireEnv("VITE_SUPABASE_URL"),
  supabaseAnonKey: requireEnv("VITE_SUPABASE_ANON_KEY"),

  /** URL pública da aplicação, sem barra final. */
  appBaseUrl: (import.meta.env.VITE_APP_BASE_URL ?? window.location.origin).replace(/\/$/, ""),

  /** Rótulo de modo exibido na UI. O modo real de cada participante vem do convite. */
  studyMode: (import.meta.env.VITE_STUDY_MODE ?? "piloto") as StudyMode,

  /**
   * Identidade visual da plataforma. PENDENTE DE DECISÃO (PERGUNTAR 25):
   * o estudo é da UnB (CEP/CHS-UnB) e o TCLE afirma que a participação não é
   * psicoterapia — usar marca de consultório privado pode gerar ambiguidade.
   * Default: "neutra" com menção à UnB. Trocável sem retrabalho.
   */
  identidade: "neutra" as IdentidadeVisual,

  instituicao: {
    nome: "Universidade de Brasília",
    programa: "Programa de Pós-Graduação em Psicologia Clínica e Cultura",
    instituto: "Instituto de Psicologia",
  },

  estudo: {
    titulo: "Estudo 1 — Ativação Experimental de Esquemas e Imagética Mental",
    /** Número de vinhetas do bloco experimental. */
    totalVinhetas: 10,
  },

  /** Rotas base. Mantém a separação participante × equipe explícita. */
  rotas: {
    participante: "/participar",
    painel: "/painel",
  },
} as const;

/** Monta o link de convite completo para um token. */
export function linkDeConvite(token: string): string {
  return `${config.appBaseUrl}/#${config.rotas.participante}/${token}`;
}

/** Monta o link de recusa ("não tenho interesse") para um token. */
export function linkDeRecusa(token: string): string {
  return `${config.appBaseUrl}/#${config.rotas.participante}/recusar/${token}`;
}
