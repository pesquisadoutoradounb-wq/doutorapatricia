import { supabase } from "./supabase";
import {
  ETAPAS,
  ETAPAS_TERMINAIS,
  type EtapaParticipante,
} from "./participantSession";

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
  email: { entregues: number; aberturas: number; bounces: number };
}

const ROTULO_STATUS: Record<string, string> = {
  enviado: "Enviado",
  aberto: "Aberto",
  iniciado: "Iniciado",
  concluido: "Concluído",
  expirado: "Expirado",
};

const ROTULO_ETAPA: Record<EtapaParticipante, string> = {
  informacoes: "Informações gerais",
  tcle: "Consentimento (TCLE)",
  sociodemografico: "Sociodemográfico",
  ysq: "YSQ-S3",
  panas: "PANAS",
  instrucoes: "Instruções",
  vinhetas: "Tarefa de imaginação",
  encerramento: "Encerramento",
  concluido: "Concluído",
  inelegivel: "Inelegível",
  interrompido: "Interrompeu",
};

const ETAPAS_EXIBIDAS: EtapaParticipante[] = [...ETAPAS, ...ETAPAS_TERMINAIS];

function diaISO(ts: string | null): string | null {
  if (!ts) return null;
  return new Date(ts).toISOString().slice(0, 10);
}

export async function carregarMetricas(
  studyId: string,
  { incluirPiloto = false }: { incluirPiloto?: boolean } = {},
): Promise<MetricasEstudo> {
  let qInvites = supabase
    .from("invites")
    .select("id, status, enviado_em, primeiro_acesso_em, criado_em")
    .eq("study_id", studyId);
  let qParticipantes = supabase
    .from("participants")
    .select("etapa_atual, criado_em, concluido_em")
    .eq("study_id", studyId)
    .eq("descartado", false);
  if (!incluirPiloto) {
    qInvites = qInvites.eq("modo", "producao");
    qParticipantes = qParticipantes.eq("modo", "producao");
  }

  const [{ data: invites }, { data: participantes }] = await Promise.all([
    qInvites,
    qParticipantes,
  ]);

  const inv = invites ?? [];
  const par = participantes ?? [];

  const email = { entregues: 0, aberturas: 0, bounces: 0 };
  if (inv.length > 0) {
    const { data: eventos } = await supabase
      .from("email_events")
      .select("tipo")
      .in("invite_id", inv.map((i) => i.id));
    for (const e of eventos ?? []) {
      if (e.tipo === "entregue") email.entregues++;
      else if (e.tipo === "aberto") email.aberturas++;
      else if (e.tipo === "bounce") email.bounces++;
    }
  }

  const totalConvites = inv.length;
  const totalParticipantes = par.length;
  const acessaram = inv.filter((i) => i.primeiro_acesso_em).length;

  const posTcle = new Set<string>([
    ...ETAPAS.slice(ETAPAS.indexOf("sociodemografico")),
    "inelegivel", // respondeu o sociodemográfico → passou pelo consentimento
  ]);
  const consentiram = par.filter((p) => posTcle.has(p.etapa_atual)).length;
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
  const porEtapa = ETAPAS_EXIBIDAS.map((e) => ({
    rotulo: ROTULO_ETAPA[e],
    valor: etapaMap.get(e) ?? 0,
  })).filter((x) => x.valor > 0);

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
    email,
  };
}
