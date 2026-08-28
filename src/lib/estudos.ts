import { supabase } from "./supabase";

export interface Estudo {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
}

export async function listarEstudos(): Promise<Estudo[]> {
  const { data, error } = await supabase
    .from("studies")
    .select("id, slug, nome, descricao, ativo, ordem")
    .order("ordem");
  if (error || !data) return [];
  return data as Estudo[];
}

export async function estudoPorId(id: string): Promise<Estudo | null> {
  const { data } = await supabase
    .from("studies")
    .select("id, slug, nome, descricao, ativo, ordem")
    .eq("id", id)
    .maybeSingle();
  return (data as Estudo | null) ?? null;
}
