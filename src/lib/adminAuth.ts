import { supabase } from "./supabase";

export type PapelAdmin = "admin" | "colaborador" | "leitura";

export interface PerfilAdmin {
  userId: string;
  nome: string | null;
  papel: PapelAdmin;
}

/**
 * Retorna o perfil de admin do usuário autenticado, ou null se o usuário
 * autenticado não estiver em `research_admins` (ou não houver sessão).
 *
 * Um participante (sessão anônima) sempre recebe null aqui — a sessão anônima
 * não tem linha em `research_admins`, e o RLS bloqueia a leitura.
 */
export async function perfilAdminAtual(): Promise<PerfilAdmin | null> {
  const { data: sessao } = await supabase.auth.getSession();
  if (!sessao.session || sessao.session.user.is_anonymous) return null;

  const { data, error } = await supabase
    .from("research_admins")
    .select("user_id, nome, papel")
    .eq("user_id", sessao.session.user.id)
    .maybeSingle();

  if (error || !data) return null;
  return { userId: data.user_id, nome: data.nome, papel: data.papel as PapelAdmin };
}

export async function entrarAdmin(email: string, senha: string) {
  return supabase.auth.signInWithPassword({ email, password: senha });
}

export async function sairAdmin() {
  return supabase.auth.signOut();
}
