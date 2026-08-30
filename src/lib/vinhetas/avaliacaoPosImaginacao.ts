/**
 * Avaliação imediata após a imaginação guiada (sub-projeto D).
 *
 * Schema + lógica de desvio, a partir de `Patricia/avaliação pós imaginaçaõ
 * plataforma.docx` e das PERGUNTAR 16–19. Cada `campo` casa 1:1 com uma coluna
 * de `vignette_responses`.
 *
 * Desvios:
 *  - Q1 = 0 ("Não consegui me imaginar") → esconde Q2–Q6 (pula para Q7).
 *  - Q3 (intensidade) = 0 → esconde a matriz de emoções (Q3b), segue para Q4.
 *  - Q7 = "Não" ou "Não tenho certeza" → esconde Q8–Q11 (pula para Q12).
 */

export const EMOCOES_Q3 = [
  { chave: "ansiedade", rotulo: "Ansiedade" },
  { chave: "culpa", rotulo: "Culpa" },
  { chave: "tristeza", rotulo: "Tristeza" },
  { chave: "raiva_irritacao", rotulo: "Raiva/irritação" },
  { chave: "vergonha", rotulo: "Vergonha" },
  { chave: "medo", rotulo: "Medo" },
  { chave: "tensao", rotulo: "Tensão" },
  { chave: "frustracao", rotulo: "Frustração" },
] as const;

export const TENDENCIAS_Q12 = [
  { chave: "atender", rotulo: "Atender ao que a outra pessoa deseja" },
  { chave: "expressar", rotulo: "Expressar o que eu quero ou preciso" },
  { chave: "evitar", rotulo: "Evitar ou sair da situação" },
  { chave: "silencio", rotulo: "Ficar em silêncio ou não demonstrar o que estou sentindo" },
  { chave: "explicar", rotulo: "Explicar ou justificar minha posição" },
  { chave: "afastar", rotulo: "Afastar-me da outra pessoa" },
  { chave: "criticar_se", rotulo: "Criticar ou cobrar a mim mesmo(a)" },
] as const;

export const CATEGORIAS_EMOCAO_Q2 = [
  { valor: "ansiedade", rotulo: "Ansiedade" },
  { valor: "culpa", rotulo: "Culpa" },
  { valor: "tristeza", rotulo: "Tristeza" },
  { valor: "raiva_irritacao", rotulo: "Raiva/irritação" },
  { valor: "vergonha", rotulo: "Vergonha" },
  { valor: "medo", rotulo: "Medo" },
  { valor: "tensao", rotulo: "Tensão" },
  { valor: "frustracao", rotulo: "Frustração" },
  { valor: "outra", rotulo: "Outra" },
];

export const PERSPECTIVAS_Q9 = [
  {
    valor: "proprios_olhos",
    rotulo:
      "Principalmente pelos meus próprios olhos, como se eu estivesse dentro da situação",
  },
  {
    valor: "observador",
    rotulo: "Principalmente como um observador, vendo a mim mesmo(a) na situação",
  },
  { valor: "alternava", rotulo: "Alternava entre as duas perspectivas" },
  { valor: "outra", rotulo: "Outra perspectiva" },
  { valor: "nao_identifico", rotulo: "Não consigo identificar" },
];

export type MatrizEmocao = Record<string, number> & {
  outra?: { rotulo: string; valor: number };
};

export type CampoAvaliacao =
  | "q1_imersao"
  | "q2_emocao_aberta"
  | "q2_emocao_categoria"
  | "q2_emocao_outra"
  | "q3_intensidade"
  | "q3_matriz"
  | "q4_valencia_emocional"
  | "q5_desconforto"
  | "q6_pensamento_automatico"
  | "q7_imagem_espontanea"
  | "q8_vividez"
  | "q9_perspectiva"
  | "q9_perspectiva_outra"
  | "q10_valencia_imagem"
  | "q11_conteudo_imagem"
  | "q12_tendencia_aberta"
  | "q12_matriz";

export type ValorAvaliacao =
  | string
  | number
  | null
  | undefined
  | Record<string, unknown>;

export type RespostasAvaliacao = Partial<Record<CampoAvaliacao, ValorAvaliacao>>;

export interface QuestaoAvaliacao {
  campo: CampoAvaliacao;
  numero: string;
  enunciado: string;
  ajuda?: string;
  tipo: "escala" | "matriz" | "radio" | "texto";
  // escala
  min?: number;
  max?: number;
  rotuloMin?: string;
  rotuloMax?: string;
  // matriz
  linhas?: readonly { chave: string; rotulo: string }[];
  comOutra?: boolean;
  // radio
  opcoes?: { valor: string; rotulo: string }[];
  // texto
  longo?: boolean;
  // visibilidade
  visivelSe?: (r: RespostasAvaliacao) => boolean;
}

const imersaoOk = (r: RespostasAvaliacao) =>
  typeof r.q1_imersao === "number" && r.q1_imersao > 0;
const imagemSim = (r: RespostasAvaliacao) => r.q7_imagem_espontanea === "sim";

export const INTRODUCAO_AVALIACAO =
  "Agora responda às perguntas a seguir considerando somente o que você " +
  "experimentou enquanto imaginava a situação que acabou de ser apresentada. " +
  "Não existem respostas certas ou erradas. Procure responder de acordo com o " +
  "que efetivamente aconteceu durante a experiência.";

export const AVALIACAO_POS_IMAGINACAO: QuestaoAvaliacao[] = [
  {
    campo: "q1_imersao",
    numero: "1",
    enunciado:
      "Quanto você conseguiu se imaginar realmente vivendo a situação apresentada?",
    tipo: "escala",
    min: 0,
    max: 10,
    rotuloMin: "Não consegui me imaginar na situação",
    rotuloMax: "Consegui me imaginar completamente na situação",
  },
  {
    campo: "q2_emocao_aberta",
    numero: "2",
    enunciado:
      "Qual foi a principal emoção ou sentimento que surgiu enquanto você " +
      "imaginava essa situação?",
    ajuda: "Escreva apenas 1.",
    tipo: "texto",
    visivelSe: imersaoOk,
  },
  {
    campo: "q2_emocao_categoria",
    numero: "2",
    enunciado:
      "Qual das opções abaixo melhor representa a principal emoção que você sentiu?",
    tipo: "radio",
    opcoes: CATEGORIAS_EMOCAO_Q2,
    visivelSe: imersaoOk,
  },
  {
    campo: "q3_intensidade",
    numero: "3",
    enunciado:
      "Considerando a emoção que você identificou como predominante, qual foi a " +
      "intensidade dessa emoção?",
    tipo: "escala",
    min: 0,
    max: 10,
    rotuloMin: "Nenhuma intensidade",
    rotuloMax: "Intensidade extrema",
    visivelSe: imersaoOk,
  },
  {
    campo: "q3_matriz",
    numero: "3",
    enunciado: "Quanto você sentiu cada uma das emoções abaixo?",
    tipo: "matriz",
    linhas: EMOCOES_Q3,
    visivelSe: (r) =>
      imersaoOk(r) &&
      typeof r.q3_intensidade === "number" &&
      r.q3_intensidade > 0,
  },
  {
    campo: "q4_valencia_emocional",
    numero: "4",
    enunciado:
      "De modo geral, como foi emocionalmente a experiência de se imaginar nessa situação?",
    tipo: "escala",
    min: -5,
    max: 5,
    rotuloMin: "Muito desagradável",
    rotuloMax: "Muito agradável",
    visivelSe: imersaoOk,
  },
  {
    campo: "q5_desconforto",
    numero: "5",
    enunciado:
      "Quanto desconforto emocional você sentiu enquanto imaginava essa situação?",
    tipo: "escala",
    min: 0,
    max: 10,
    rotuloMin: "Nenhum desconforto",
    rotuloMax: "Desconforto extremo",
    visivelSe: imersaoOk,
  },
  {
    campo: "q6_pensamento_automatico",
    numero: "6",
    enunciado:
      "Enquanto você imaginava a situação, qual foi o principal pensamento, " +
      "frase ou ideia que passou espontaneamente pela sua mente?",
    ajuda: "Se nenhum pensamento específico surgiu, escreva “nenhum”.",
    tipo: "texto",
    longo: true,
    visivelSe: imersaoOk,
  },
  {
    campo: "q7_imagem_espontanea",
    numero: "7",
    enunciado:
      "Além da situação que você estava tentando imaginar conforme a instrução " +
      "do áudio, surgiu espontaneamente em sua mente alguma outra imagem, cena, " +
      "detalhe visual ou lembrança?",
    tipo: "radio",
    opcoes: [
      { valor: "sim", rotulo: "Sim" },
      { valor: "nao", rotulo: "Não" },
      { valor: "nao_tenho_certeza", rotulo: "Não tenho certeza" },
    ],
  },
  {
    campo: "q8_vividez",
    numero: "8",
    enunciado: "Quão clara e vívida foi essa imagem ou cena mental?",
    tipo: "escala",
    min: 0,
    max: 10,
    rotuloMin: "Nada clara ou vívida",
    rotuloMax: "Extremamente clara e vívida, quase como se estivesse vendo de verdade",
    visivelSe: imagemSim,
  },
  {
    campo: "q9_perspectiva",
    numero: "9",
    enunciado:
      "De qual perspectiva você percebeu principalmente essa imagem ou cena mental?",
    tipo: "radio",
    opcoes: PERSPECTIVAS_Q9,
    visivelSe: imagemSim,
  },
  {
    campo: "q10_valencia_imagem",
    numero: "10",
    enunciado: "Como você classificaria essa imagem ou cena mental?",
    tipo: "escala",
    min: -5,
    max: 5,
    rotuloMin: "Muito negativa/desagradável",
    rotuloMax: "Muito positiva/agradável",
    visivelSe: imagemSim,
  },
  {
    campo: "q11_conteudo_imagem",
    numero: "11",
    enunciado:
      "Descreva brevemente a imagem, cena, detalhe visual ou lembrança que " +
      "surgiu espontaneamente em sua mente.",
    ajuda:
      "Não é necessário escrever uma história completa. Descreva apenas os " +
      "principais elementos daquilo que apareceu em sua mente.",
    tipo: "texto",
    longo: true,
    visivelSe: imagemSim,
  },
  {
    campo: "q12_tendencia_aberta",
    numero: "12",
    enunciado:
      "Se essa situação estivesse realmente acontecendo com você, o que você " +
      "teria mais vontade de fazer naquele momento?",
    tipo: "texto",
    longo: true,
  },
  {
    campo: "q12_matriz",
    numero: "12",
    enunciado: "Quão forte seria a vontade de agir de cada uma destas maneiras?",
    ajuda: "0 = nenhuma vontade · 10 = vontade extremamente forte",
    tipo: "matriz",
    linhas: TENDENCIAS_Q12,
    comOutra: true,
    visivelSe: () => true,
  },
];

export function questaoVisivel(
  q: QuestaoAvaliacao,
  r: RespostasAvaliacao,
): boolean {
  return q.visivelSe ? q.visivelSe(r) : true;
}

/** Uma matriz está em branco se nenhuma linha (nem "outra") tem valor. */
export function matrizEmBranco(v: unknown): boolean {
  if (v == null || typeof v !== "object") return true;
  const obj = v as Record<string, unknown>;
  for (const [k, val] of Object.entries(obj)) {
    if (k === "outra") {
      const o = val as { valor?: number } | undefined;
      if (o && typeof o.valor === "number") return false;
    } else if (typeof val === "number" && !Number.isNaN(val)) {
      return false;
    }
  }
  return true;
}

/** `null` para uma resposta em branco, `1` caso contrário — para contagem. */
export function marcaBranco(
  q: QuestaoAvaliacao,
  valor: ValorAvaliacao,
): 1 | null {
  if (q.tipo === "matriz") return matrizEmBranco(valor) ? null : 1;
  if (q.tipo === "escala") return typeof valor === "number" ? 1 : null;
  if (typeof valor === "string") return valor.trim() === "" ? null : 1;
  return valor == null ? null : 1;
}

export function questoesAplicaveis(r: RespostasAvaliacao): QuestaoAvaliacao[] {
  return AVALIACAO_POS_IMAGINACAO.filter((q) => questaoVisivel(q, r));
}

/** Limpa respostas de questões que deixaram de estar visíveis pelo desvio. */
export function normalizarRespostas(r: RespostasAvaliacao): RespostasAvaliacao {
  const saida: RespostasAvaliacao = { ...r };
  for (const q of AVALIACAO_POS_IMAGINACAO) {
    if (!questaoVisivel(q, saida) && saida[q.campo] != null) {
      saida[q.campo] = null;
    }
  }
  // q2_emocao_outra só faz sentido com categoria = "outra"
  if (saida.q2_emocao_categoria !== "outra" && saida.q2_emocao_outra != null) {
    saida.q2_emocao_outra = null;
  }
  if (saida.q9_perspectiva !== "outra" && saida.q9_perspectiva_outra != null) {
    saida.q9_perspectiva_outra = null;
  }
  return saida;
}
