/**
 * Escores dos instrumentos basais (sub-projeto E3). Puro; nada de rede.
 *
 * YSQ-S3: 18 esquemas × 5 itens. Esquema `s` = itens {s, s+18, s+36, s+54,
 * s+72} (fórmula da folha de correção). Domínios conforme a folha.
 * PANAS: PA = itens 1–9, NA = itens 10–19. (Faixas de classificação pendentes
 * da pesquisadora — ver spec.)
 */

export interface EsquemaYsq {
  indice: number; // 1..18
  chave: string;
  nome: string;
  dominio: number; // 1..5
}

export const DOMINIOS_YSQ: { indice: number; nome: string }[] = [
  { indice: 1, nome: "Desconexão e rejeição" },
  { indice: 2, nome: "Autonomia e desempenho prejudicados" },
  { indice: 3, nome: "Limites prejudicados" },
  { indice: 4, nome: "Orientação para os outros" },
  { indice: 5, nome: "Supervigilância e inibição" },
];

export const ESQUEMAS_YSQ: EsquemaYsq[] = [
  { indice: 1, chave: "privacao_emocional", nome: "Privação Emocional", dominio: 1 },
  { indice: 2, chave: "abandono", nome: "Abandono", dominio: 1 },
  { indice: 3, chave: "desconfianca_abuso", nome: "Desconfiança / Abuso", dominio: 1 },
  { indice: 4, chave: "isolamento_social", nome: "Isolamento Social / Alienação", dominio: 1 },
  { indice: 5, chave: "defectividade_vergonha", nome: "Defectividade / Vergonha", dominio: 1 },
  { indice: 6, chave: "fracasso", nome: "Fracasso", dominio: 2 },
  { indice: 7, chave: "dependencia_incompetencia", nome: "Dependência / Incompetência", dominio: 2 },
  { indice: 8, chave: "vulnerabilidade", nome: "Vulnerabilidade", dominio: 2 },
  { indice: 9, chave: "emaranhamento", nome: "Emaranhamento", dominio: 2 },
  { indice: 10, chave: "subjugacao", nome: "Subjugação", dominio: 4 },
  { indice: 11, chave: "autossacrificio", nome: "Autossacrifício", dominio: 4 },
  { indice: 12, chave: "inibicao_emocional", nome: "Inibição Emocional", dominio: 5 },
  { indice: 13, chave: "padroes_inflexiveis", nome: "Padrões Inflexíveis", dominio: 5 },
  { indice: 14, chave: "grandiosidade", nome: "Grandiosidade / Arrogo", dominio: 3 },
  { indice: 15, chave: "autocontrole_insuficiente", nome: "Autocontrole e Autodisciplina Insuficientes", dominio: 3 },
  { indice: 16, chave: "busca_aprovacao", nome: "Busca de Aprovação", dominio: 4 },
  { indice: 17, chave: "negativismo", nome: "Negativismo", dominio: 5 },
  { indice: 18, chave: "postura_punitiva", nome: "Postura Punitiva", dominio: 5 },
];

export function itensDoEsquema(indice: number): number[] {
  return [indice, indice + 18, indice + 36, indice + 54, indice + 72];
}

function agrega(valores: Map<number, number>, itens: number[]) {
  let total = 0;
  let respondidos = 0;
  for (const it of itens) {
    const v = valores.get(it);
    if (typeof v === "number" && !Number.isNaN(v)) {
      total += v;
      respondidos++;
    }
  }
  return {
    total,
    respondidos,
    media: respondidos > 0 ? Math.round((total / respondidos) * 100) / 100 : null,
  };
}

export interface EscoreYsq {
  esquemas: {
    indice: number;
    chave: string;
    nome: string;
    dominio: number;
    total: number;
    media: number | null;
    respondidos: number;
  }[];
  dominios: {
    indice: number;
    nome: string;
    total: number;
    media: number | null;
    respondidos: number;
  }[];
}

export function escoreYsq(valores: Map<number, number>): EscoreYsq {
  const esquemas = ESQUEMAS_YSQ.map((e) => ({
    indice: e.indice,
    chave: e.chave,
    nome: e.nome,
    dominio: e.dominio,
    ...agrega(valores, itensDoEsquema(e.indice)),
  }));

  const dominios = DOMINIOS_YSQ.map((d) => {
    const itens = ESQUEMAS_YSQ.filter((e) => e.dominio === d.indice).flatMap((e) =>
      itensDoEsquema(e.indice),
    );
    return { indice: d.indice, nome: d.nome, ...agrega(valores, itens) };
  });

  return { esquemas, dominios };
}

// ---------------------------------------------------------------------------
// PANAS
// ---------------------------------------------------------------------------

export const PANAS_PA = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const PANAS_NA = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

export interface EscorePanas {
  paTotal: number;
  naTotal: number;
  paMedia: number | null;
  naMedia: number | null;
  paRespondidos: number;
  naRespondidos: number;
}

export function escorePanas(valores: Map<number, number>): EscorePanas {
  const pa = agrega(valores, PANAS_PA);
  const na = agrega(valores, PANAS_NA);
  return {
    paTotal: pa.total,
    naTotal: na.total,
    paMedia: pa.media,
    naMedia: na.media,
    paRespondidos: pa.respondidos,
    naRespondidos: na.respondidos,
  };
}

// ---------------------------------------------------------------------------
// Helpers de agregação entre participantes
// ---------------------------------------------------------------------------

export function mapaDeRespostas(
  linhas: { participant_id: string; item: number; valor: number }[],
): Map<string, Map<number, number>> {
  const porParticipante = new Map<string, Map<number, number>>();
  for (const l of linhas) {
    let m = porParticipante.get(l.participant_id);
    if (!m) {
      m = new Map();
      porParticipante.set(l.participant_id, m);
    }
    m.set(l.item, l.valor);
  }
  return porParticipante;
}

export function media(valores: (number | null | undefined)[]): number | null {
  const nums = valores.filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}
