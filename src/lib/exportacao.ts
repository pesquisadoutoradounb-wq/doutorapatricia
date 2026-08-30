import { supabase } from "./supabase";

// ---------------------------------------------------------------------------
// Serialização CSV
// ---------------------------------------------------------------------------

function celula(v: unknown): string {
  if (v == null) return "";
  let s: string;
  if (Array.isArray(v) || (typeof v === "object")) s = JSON.stringify(v);
  else s = String(v);
  if (/[",\r\n;]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** CSV com cabeçalho a partir da união das chaves (ordem da 1ª linha + novas). */
export function paraCsv(linhas: Record<string, unknown>[]): string {
  if (linhas.length === 0) return "";
  const cols: string[] = [];
  for (const l of linhas) for (const k of Object.keys(l)) if (!cols.includes(k)) cols.push(k);
  const cabecalho = cols.map(celula).join(",");
  const corpo = linhas.map((l) => cols.map((c) => celula(l[c])).join(","));
  return [cabecalho, ...corpo].join("\r\n");
}

export function baixarArquivo(nome: string, conteudo: string, mime: string) {
  const blob = new Blob(["﻿" + conteudo], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function nomeArquivo(conjunto: string, ext: string): string {
  const hoje = new Date().toISOString().slice(0, 10);
  return `estudo1_${conjunto}_${hoje}.${ext}`;
}

// ---------------------------------------------------------------------------
// Carga
// ---------------------------------------------------------------------------

export interface ExportCompleto {
  participantes: Record<string, unknown>[];
  sociodemografico: Record<string, unknown>[];
  ysq: Record<string, unknown>[];
  panas: Record<string, unknown>[];
  vinhetas_ordem: Record<string, unknown>[];
  vinhetas_avaliacao: Record<string, unknown>[];
  consentimento: Record<string, unknown>[];
}

export const CONJUNTOS: (keyof ExportCompleto)[] = [
  "participantes",
  "sociodemografico",
  "ysq",
  "panas",
  "vinhetas_ordem",
  "vinhetas_avaliacao",
  "consentimento",
];

async function selecionarPorParticipante(
  tabela: string,
  ids: string[],
): Promise<Record<string, unknown>[]> {
  if (ids.length === 0) return [];
  const { data } = await supabase.from(tabela).select("*").in("participant_id", ids);
  return (data ?? []) as Record<string, unknown>[];
}

export async function carregarExport(
  studyId: string,
  { incluirPiloto = false }: { incluirPiloto?: boolean } = {},
): Promise<ExportCompleto> {
  let q = supabase
    .from("participants")
    .select(
      "id, modo, etapa_atual, criado_em, concluido_em",
    )
    .eq("study_id", studyId)
    .eq("descartado", false);
  if (!incluirPiloto) q = q.eq("modo", "producao");
  const { data: parts } = await q;
  const participantes = (parts ?? []) as { id: string }[];
  const ids = participantes.map((p) => p.id);

  const [socio, ysq, panas, ordem, aval, consent] = await Promise.all([
    selecionarPorParticipante("sociodemographic_responses", ids),
    selecionarPorParticipante("ysq_item_responses", ids),
    selecionarPorParticipante("panas_item_responses", ids),
    selecionarPorParticipante("vignette_order", ids),
    selecionarPorParticipante("vignette_responses", ids),
    selecionarPorParticipante("consent_records", ids),
  ]);

  const renomeiaId = (linhas: Record<string, unknown>[]) =>
    linhas.map(({ participant_id, ...resto }) => ({
      participant_id,
      ...resto,
    }));

  return {
    participantes: participantes.map((p) => ({
      participant_id: p.id,
      ...Object.fromEntries(Object.entries(p).filter(([k]) => k !== "id")),
    })),
    sociodemografico: renomeiaId(socio),
    ysq: renomeiaId(
      ysq.map((r) => ({
        participant_id: r.participant_id,
        item: r.item,
        valor: r.valor,
        respondido_em: r.respondido_em,
      })),
    ),
    panas: renomeiaId(
      panas.map((r) => ({
        participant_id: r.participant_id,
        item: r.item,
        valor: r.valor,
        respondido_em: r.respondido_em,
      })),
    ),
    vinhetas_ordem: renomeiaId(ordem),
    vinhetas_avaliacao: renomeiaId(aval),
    consentimento: renomeiaId(
      consent.map((r) => ({
        participant_id: r.participant_id,
        decisao: r.decisao,
        tcle_versao: r.tcle_versao,
        registrado_em: r.registrado_em,
      })),
    ),
  };
}
