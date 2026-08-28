import { useEffect, useState } from "react";
import { useEstudo } from "./EstudoLayout";
import { supabase } from "../../lib/supabase";

function Titulo({ secao, nome }: { secao: string; nome?: string }) {
  return (
    <div className="tela-titulo">
      <span className="eyebrow">{nome ?? "Estudo"}</span>
      <h1>{secao}</h1>
      <hr className="regua" />
    </div>
  );
}

export function DashboardEstudo() {
  const estudo = useEstudo();
  const [contagem, setContagem] = useState<{ convites: number; participantes: number } | null>(null);

  useEffect(() => {
    if (!estudo) return;
    (async () => {
      const [c, p] = await Promise.all([
        supabase.from("invites").select("id", { count: "exact", head: true }).eq("study_id", estudo.id),
        supabase.from("participants").select("id", { count: "exact", head: true }).eq("study_id", estudo.id),
      ]);
      setContagem({ convites: c.count ?? 0, participantes: p.count ?? 0 });
    })();
  }, [estudo]);

  return (
    <div>
      <Titulo secao="Painel" nome={estudo?.nome} />
      <div className="metricas">
        <div className="metrica">
          <span className="metrica__valor">{contagem?.convites ?? "—"}</span>
          <span className="metrica__rotulo">Convites</span>
        </div>
        <div className="metrica">
          <span className="metrica__valor">{contagem?.participantes ?? "—"}</span>
          <span className="metrica__rotulo">Participantes</span>
        </div>
      </div>
      <div className="aviso" style={{ marginTop: "var(--espaco-6)" }}>
        Taxas de resposta e conclusão, filtros por período e gráficos entram no
        sub-projeto E.
      </div>
    </div>
  );
}

export function Convites() {
  const estudo = useEstudo();
  return (
    <div>
      <Titulo secao="Convites" nome={estudo?.nome} />
      <div className="aviso">
        Importar CSV, disparar convites em lote via Brevo e o quadro de status
        (enviado / entregue / aberto / iniciado / concluído) entram no
        sub-projeto E.
      </div>
    </div>
  );
}

export function Participantes() {
  const estudo = useEstudo();
  return (
    <div>
      <Titulo secao="Participantes" nome={estudo?.nome} />
      <div className="aviso">
        Lista de participantes por <code>participant_id</code> pseudônimo, etapa
        atual e progresso — sem nome/e-mail nesta tela operacional. Entra no
        sub-projeto E.
      </div>
    </div>
  );
}

export function Exportar() {
  const estudo = useEstudo();
  return (
    <div>
      <Titulo secao="Exportar" nome={estudo?.nome} />
      <div className="aviso">
        Exportação anonimizada (por <code>participant_id</code>, sem e-mail/nome)
        de sociodemográfico, YSQ, PANAS e vinhetas em CSV/XLSX — sub-projeto E.
      </div>
    </div>
  );
}
