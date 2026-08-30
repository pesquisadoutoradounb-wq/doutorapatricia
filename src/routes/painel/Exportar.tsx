import { useEffect, useState } from "react";
import { useEstudo } from "./EstudoLayout";
import { AlternadorModo } from "../../components/painel/AlternadorModo";
import { CabecalhoTela } from "../../components/painel/CabecalhoTela";
import {
  CONJUNTOS,
  baixarArquivo,
  carregarExport,
  nomeArquivo,
  paraCsv,
  type ExportCompleto,
} from "../../lib/exportacao";

const ROTULO: Record<keyof ExportCompleto, string> = {
  participantes: "Participantes",
  sociodemografico: "Sociodemográfico",
  ysq: "YSQ-S3 (respostas por item)",
  ysq_escores: "YSQ-S3 (escores por esquema e domínio)",
  panas: "PANAS (respostas por item)",
  panas_escores: "PANAS (escores PA / NA)",
  vinhetas_ordem: "Ordem das vinhetas",
  vinhetas_avaliacao: "Avaliação das vinhetas",
  consentimento: "Consentimentos",
};

export function Exportar() {
  const estudo = useEstudo();
  const [incluirPiloto, setIncluirPiloto] = useState(false);
  const [dados, setDados] = useState<ExportCompleto | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!estudo) return;
    setDados(null);
    setErro(null);
    setCarregando(true);
    carregarExport(estudo.id, { incluirPiloto })
      .then(setDados)
      .catch(() => setErro("Não foi possível carregar os dados."))
      .finally(() => setCarregando(false));
  }, [estudo, incluirPiloto]);

  return (
    <div>
      <CabecalhoTela
        sobretitulo={estudo?.nome ?? "Estudo"}
        titulo="Exportar"
        acoes={
          <AlternadorModo incluirPiloto={incluirPiloto} onChange={setIncluirPiloto} />
        }
      >
        <p>
          Dados anonimizados, identificados só pelo <code>participant_id</code>{" "}
          (pseudônimo) — sem e-mail ou nome. Codificação UTF-8, separador vírgula.
        </p>
      </CabecalhoTela>

      {carregando && <p role="status">Carregando dados…</p>}
      {erro && <p className="erro-caixa">{erro}</p>}

      {dados && (
        <>
          <div className="lista-docs">
            {CONJUNTOS.map((c) => {
              const linhas = dados[c];
              return (
                <section key={c} className="cartao-painel">
                  <div className="cartao-painel__corpo lista-docs__cabeca">
                    <div>
                      <strong>{ROTULO[c]}</strong>
                      <span className="documento__versao">
                        {linhas.length} linha(s)
                      </span>
                    </div>
                    <button
                      type="button"
                      className="botao botao--secundario"
                      disabled={linhas.length === 0}
                      onClick={() =>
                        baixarArquivo(
                          nomeArquivo(c, "csv"),
                          paraCsv(linhas),
                          "text/csv",
                        )
                      }
                    >
                      Baixar CSV
                    </button>
                  </div>
                </section>
              );
            })}
          </div>

          <div style={{ marginTop: "var(--espaco-6)" }}>
            <button
              type="button"
              className="botao"
              onClick={() =>
                baixarArquivo(
                  nomeArquivo("tudo", "json"),
                  JSON.stringify(dados, null, 2),
                  "application/json",
                )
              }
            >
              Baixar tudo (JSON)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
