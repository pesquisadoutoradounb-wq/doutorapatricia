import { supabase } from "./supabase";
import { ETAPAS, type Etapa } from "./participantSession";

export interface MetricasEstudo {
  totalConvites: number;
  totalParticipantes: number;
  concluidos: number;
  taxaResposta: number; // participantes / convites
  taxaConclusao: number; // concluídos / participantes
  funil: { rotulo: string; valor: number }[];
  porStatus: { rotulo: string; valor: number }[];
  porEtapa: { rotulo: string; valor: number }[];
  linhaTempo: { data: string; convites: number; concluidos: number }[];
}

const ROTULO_STATUS: Record<string, string> = {
  enviado: "Enviado",
  aberto: "Aberto",
  iniciado: "Iniciado",
  concluido: "Concluído",
  expirado: "Expirado",
};

const ROTULO_ETAPA: Record<Etapa, string> = {
  informacoes: "Informações gerais",
  tcle: "Consentimento (TCLE)",
  sociodemografico: "Sociodemográfico",
  ysq: "YSQ-S3",
  panas: "PANAS",
  instrucoes: "Instruções",
  vinhetas: "Tarefa de imaginação",
  encerramento: "Encerramento",
  concluido: "Concluído",
};

function diaISO(ts: string | null): string | null {
  if (!ts) return null;
  return new Date(ts).toISOString().slice(0, 10);
}

export async function carregarMetricas(studyId: string): Promise<MetricasEstudo> {
  const [{ data: invites }, { data: participantes }] = await Promise.all([
    supabase
      .from("invites")
      .select("status, enviado_em, primeiro_acesso_em, criado_em")
      .eq("study_id", studyId),
    supabase
      .from("participants")
      .select("etapa_atual, criado_em, concluido_em")
      .eq("study_id", studyId),
  ]);

  const inv = invites ?? [];
  const par = participantes ?? [];

  const totalConvites = inv.length;
  const totalParticipantes = par.length;
  const acessaram = inv.filter((i) => i.primeiro_acesso_em).length;

  const posTcle = new Set<Etapa>(ETAPAS.slice(ETAPAS.indexOf("sociodemografico")));
  const consentiram = par.filter((p) => posTcle.has(p.etapa_atual as Etapa)).length;
  const concluidos = par.filter((p) => p.etapa_atual === "concluido" || p.concluido_em).length;

  // por status
  const statusMap = new Map<string, number>();
  for (const i of inv) statusMap.set(i.status, (statusMap.get(i.status) ?? 0) + 1);
  const porStatus = ["enviado", "aberto", "iniciado", "concluido", "expirado"]
    .map((s) => ({ rotulo: ROTULO_STATUS[s], valor: statusMap.get(s) ?? 0 }))
    .filter((x) => x.valor > 0);

  // por etapa
  const etapaMap = new Map<string, number>();
  for (const p of par) etapaMap.set(p.etapa_atual, (etapaMap.get(p.etapa_atual) ?? 0) + 1);
  const porEtapa = ETAPAS.map((e) => ({ rotulo: ROTULO_ETAPA[e], valor: etapaMap.get(e) ?? 0 })).filter(
    (x) => x.valor > 0,
  );

  // linha do tempo (acumulado por dia)
  const dias = new Set<string>();
  const convPorDia = new Map<string, number>();
  const conclPorDia = new Map<string, number>();
  for (const i of inv) {
    const d = diaISO(i.enviado_em ?? i.criado_em);
    if (d) {
      dias.add(d);
      convPorDia.set(d, (convPorDia.get(d) ?? 0) + 1);
    }
  }
  for (const p of par) {
    const d = diaISO(p.concluido_em);
    if (d) {
      dias.add(d);
      conclPorDia.set(d, (conclPorDia.get(d) ?? 0) + 1);
    }
  }
  const diasOrd = [...dias].sort();
  let ac = 0;
  let acc = 0;
  const linhaTempo = diasOrd.map((d) => {
    ac += convPorDia.get(d) ?? 0;
    acc += conclPorDia.get(d) ?? 0;
    return { data: d, convites: ac, concluidos: acc };
  });

  return {
    totalConvites,
    totalParticipantes,
    concluidos,
    taxaResposta: totalConvites ? totalParticipantes / totalConvites : 0,
    taxaConclusao: totalParticipantes ? concluidos / totalParticipantes : 0,
    funil: [
      { rotulo: "Convidados", valor: totalConvites },
      { rotulo: "Acessaram o link", valor: acessaram },
      { rotulo: "Consentiram", valor: consentiram },
      { rotulo: "Concluíram", valor: concluidos },
    ],
    porStatus,
    porEtapa,
    linhaTempo,
  };
}
