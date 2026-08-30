import { useEffect, useState } from "react";
import { useEstudo } from "./EstudoLayout";
import { AlternadorModo } from "../../components/painel/AlternadorModo";
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
  panas: "PANAS (respostas por item)",
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
      <div className="tela-titulo">
        <span className="eyebrow">{estudo?.nome}</span>
        <h1>Exportar</h1>
        <hr className="regua" />
      </div>
      <p className="documento__versao">
        Dados anonimizados, identificados só pelo <code>participant_id</code>
        (pseudônimo) — sem e-mail ou nome. Codificação UTF-8, separador vírgula.
      </p>

      <div style={{ margin: "var(--espaco-4) 0" }}>
        <AlternadorModo incluirPiloto={incluirPiloto} onChange={setIncluirPiloto} />
      </div>

      {carregando && <p role="status">Carregando dados…</p>}
      {erro && <p className="erro-caixa">{erro}</p>}

      {dados && (
        <>
          <div className="lista-docs">
            {CONJUNTOS.map((c) => {
              const linhas = dados[c];
              return (
                <div key={c} className="cartao">
                  <div className="lista-docs__cabeca">
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
                </div>
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
