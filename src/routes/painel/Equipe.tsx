import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { CabecalhoTela } from "../../components/painel/CabecalhoTela";
import { TabelaCartao } from "../../components/painel/TabelaCartao";
import { Selo } from "../../components/painel/Selo";

interface Membro {
  user_id: string;
  nome: string | null;
  papel: string;
  criado_em: string;
}

export function Equipe() {
  const [membros, setMembros] = useState<Membro[] | null>(null);

  useEffect(() => {
    supabase
      .from("research_admins")
      .select("user_id, nome, papel, criado_em")
      .order("criado_em")
      .then(({ data }) => setMembros((data ?? []) as Membro[]));
  }, []);

  return (
    <div>
      <CabecalhoTela sobretitulo="Plataforma" titulo="Equipe" />

      {membros === null ? (
        <p role="status">Carregando…</p>
      ) : (
        <TabelaCartao titulo="Membros" contagem={membros.length}>
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Papel</th>
                <th className="num">Desde</th>
              </tr>
            </thead>
            <tbody>
              {membros.map((m) => (
                <tr key={m.user_id}>
                  <td>{m.nome ?? "—"}</td>
                  <td>
                    <Selo tom={m.papel === "admin" ? "info" : "neutro"}>
                      {m.papel}
                    </Selo>
                  </td>
                  <td className="num">
                    {new Date(m.criado_em).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
              {membros.length === 0 && (
                <tr>
                  <td className="tabela__vazio" colSpan={3}>
                    Nenhum membro cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TabelaCartao>
      )}

      <div className="aviso" style={{ marginTop: "var(--espaco-6)" }}>
        Convidar e remover membros e alterar papéis entra no sub-projeto E. Hoje:
        criar o usuário em Auth → Users e inserir a linha em{" "}
        <code>research_admins</code>.
      </div>
    </div>
  );
}
