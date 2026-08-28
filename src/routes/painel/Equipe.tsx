import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

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
      <div className="tela-titulo">
        <span className="eyebrow">Plataforma</span>
        <h1>Equipe</h1>
        <hr className="regua" />
      </div>

      {membros === null ? (
        <p role="status">Carregando…</p>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Papel</th>
              <th>Desde</th>
            </tr>
          </thead>
          <tbody>
            {membros.map((m) => (
              <tr key={m.user_id}>
                <td>{m.nome ?? "—"}</td>
                <td>{m.papel}</td>
                <td>{new Date(m.criado_em).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="aviso" style={{ marginTop: "var(--espaco-6)" }}>
        Convidar e remover membros e alterar papéis entra no sub-projeto E. Hoje:
        criar o usuário em Auth → Users e inserir a linha em{" "}
        <code>research_admins</code>.
      </div>
    </div>
  );
}
