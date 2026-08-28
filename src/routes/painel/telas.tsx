import { useEffect, useState } from "react";
import { useEstudo } from "./EstudoLayout";
import { carregarMetricas, type MetricasEstudo } from "../../lib/painelMetricas";
import { CartaoKPI, BarrasH, Funil, LinhaTempo } from "../../components/painel/graficos";

function Titulo({ secao, nome }: { secao: string; nome?: string }) {
  return (
    <div className="tela-titulo">
      <span className="eyebrow">{nome ?? "Estudo"}</span>
      <h1>{secao}</h1>
      <hr className="regua" />
    </div>
  );
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function DashboardEstudo() {
  const estudo = useEstudo();
  const [m, setM] = useState<MetricasEstudo | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!estudo) return;
    setM(null);
    setErro(false);
    carregarMetricas(estudo.id).then(setM).catch(() => setErro(true));
  }, [estudo]);

  return (
    <div>
      <Titulo secao="Painel" nome={estudo?.nome} />

      {erro && <p className="erro-caixa">Não foi possível carregar os indicadores.</p>}
      {!m && !erro && <p role="status">Carregando indicadores…</p>}

      {m && (
        <>
          <div className="kpis">
            <CartaoKPI valor={m.totalConvites} rotulo="Convites" />
            <CartaoKPI valor={m.totalParticipantes} rotulo="Participantes" />
            <CartaoKPI valor={m.concluidos} rotulo="Concluíram" />
            <CartaoKPI
              valor={pct(m.taxaResposta)}
              rotulo="Taxa de resposta"
              sub="participantes ÷ convites"
            />
            <CartaoKPI
              valor={pct(m.taxaConclusao)}
              rotulo="Taxa de conclusão"
              sub="concluíram ÷ participantes"
            />
          </div>

          <div className="dash-grade">
            <Funil titulo="Funil de participação" dados={m.funil} />
            <BarrasH titulo="Convites por status" dados={m.porStatus} />
            <BarrasH titulo="Participantes por etapa atual" dados={m.porEtapa} />
          </div>

          <LinhaTempo titulo="Convites e conclusões ao longo do tempo" dados={m.linhaTempo} />
        </>
      )}
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
