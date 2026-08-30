import { useEffect, useState } from "react";
import { useEstudo } from "./EstudoLayout";
import { carregarMetricas, type MetricasEstudo } from "../../lib/painelMetricas";
import { CartaoKPI, BarrasH, Funil, LinhaTempo } from "../../components/painel/graficos";
import { AlternadorModo } from "../../components/painel/AlternadorModo";
import { CabecalhoTela } from "../../components/painel/CabecalhoTela";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function DashboardEstudo() {
  const estudo = useEstudo();
  const [m, setM] = useState<MetricasEstudo | null>(null);
  const [erro, setErro] = useState(false);
  const [incluirPiloto, setIncluirPiloto] = useState(false);

  useEffect(() => {
    if (!estudo) return;
    setM(null);
    setErro(false);
    carregarMetricas(estudo.id, { incluirPiloto })
      .then(setM)
      .catch(() => setErro(true));
  }, [estudo, incluirPiloto]);

  return (
    <div>
      <CabecalhoTela
        sobretitulo={estudo?.nome ?? "Estudo"}
        titulo="Painel"
        acoes={
          <AlternadorModo incluirPiloto={incluirPiloto} onChange={setIncluirPiloto} />
        }
      />

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

          <div className="kpis">
            <CartaoKPI valor={m.email.entregues} rotulo="E-mails entregues" />
            <CartaoKPI valor={m.email.aberturas} rotulo="Aberturas de e-mail" />
            <CartaoKPI valor={m.email.bounces} rotulo="Bounces" />
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
