import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import type { EtapaParticipante } from "./participantSession";

export interface DadosParticipante {
  id: string;
  etapaAtual: EtapaParticipante;
  studyId: string;
  studyNome: string | null;
  modo: "piloto" | "producao";
}

type Estado =
  | { fase: "carregando" }
  | { fase: "sem-sessao" }
  | { fase: "ok"; dados: DadosParticipante };

const Ctx = createContext<{
  estado: Estado;
  recarregar: () => Promise<void>;
}>({ estado: { fase: "carregando" }, recarregar: async () => {} });

async function carregar(): Promise<Estado> {
  const { data: sessao } = await supabase.auth.getSession();
  if (!sessao.session) return { fase: "sem-sessao" };

  // Confia no RLS: se a sessão carrega o claim do participante, esta consulta
  // retorna a linha dele; senão, retorna vazio.
  const { data, error } = await supabase
    .from("participants")
    .select("id, etapa_atual, study_id, modo")
    .maybeSingle();
  if (error || !data) return { fase: "sem-sessao" };

  let studyNome: string | null = null;
  const { data: s } = await supabase
    .from("estudos_publico")
    .select("nome")
    .eq("id", data.study_id)
    .maybeSingle();
  if (s) studyNome = (s as { nome: string }).nome;

  return {
    fase: "ok",
    dados: {
      id: data.id,
      etapaAtual: data.etapa_atual as EtapaParticipante,
      studyId: data.study_id,
      studyNome,
      modo: data.modo as "piloto" | "producao",
    },
  };
}

export function ParticipanteProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ fase: "carregando" });

  const recarregar = async () => setEstado(await carregar());

  useEffect(() => {
    let vivo = true;
    carregar().then((e) => vivo && setEstado(e));
    return () => {
      vivo = false;
    };
  }, []);

  return <Ctx.Provider value={{ estado, recarregar }}>{children}</Ctx.Provider>;
}

export function useParticipante() {
  return useContext(Ctx);
}
