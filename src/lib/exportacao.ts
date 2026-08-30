import { supabase } from "./supabase";
import { escorePanas, escoreYsq, mapaDeRespostas } from "./pontuacao";

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
  ysq_escores: Record<string, unknown>[];
  panas: Record<string, unknown>[];
  panas_escores: Record<string, unknown>[];
  vinhetas_ordem: Record<string, unknown>[];
  vinhetas_avaliacao: Record<string, unknown>[];
  consentimento: Record<string, unknown>[];
}

export const CONJUNTOS: (keyof ExportCompleto)[] = [
  "participantes",
  "sociodemografico",
  "ysq",
  "ysq_escores",
  "panas",
  "panas_escores",
  "vinhetas_ordem",
  "vinhetas_avaliacao",
  "consentimento",
];

function escoresYsqPorParticipante(
  linhas: { participant_id: string; item: number; valor: number }[],
): Record<string, unknown>[] {
  return [...mapaDeRespostas(linhas).entries()].map(([participant_id, m]) => {
    const e = escoreYsq(m);
    const linha: Record<string, unknown> = { participant_id };
    for (const s of e.esquemas) {
      linha[`${s.chave}_total`] = s.total;
      linha[`${s.chave}_media`] = s.media;
    }
    for (const d of e.dominios) {
      linha[`dominio${d.indice}_total`] = d.total;
      linha[`dominio${d.indice}_media`] = d.media;
    }
    return linha;
  });
}

function escoresPanasPorParticipante(
  linhas: { participant_id: string; item: number; valor: number }[],
): Record<string, unknown>[] {
  return [...mapaDeRespostas(linhas).entries()].map(([participant_id, m]) => {
    const e = escorePanas(m);
    return {
      participant_id,
      pa_total: e.paTotal,
      na_total: e.naTotal,
      pa_media: e.paMedia,
      na_media: e.naMedia,
      pa_respondidos: e.paRespondidos,
      na_respondidos: e.naRespondidos,
    };
  });
}

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
    ysq_escores: escoresYsqPorParticipante(
      ysq as { participant_id: string; item: number; valor: number }[],
    ),
    panas: renomeiaId(
      panas.map((r) => ({
        participant_id: r.participant_id,
        item: r.item,
        valor: r.valor,
        respondido_em: r.respondido_em,
      })),
    ),
    panas_escores: escoresPanasPorParticipante(
      panas as { participant_id: string; item: number; valor: number }[],
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
