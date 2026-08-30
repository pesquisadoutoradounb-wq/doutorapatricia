import { useEffect, useState } from "react";
import { useEstudo } from "./EstudoLayout";
import {
  SLUGS_DOCUMENTO,
  carregarDocsDoEstudo,
  salvarDocumento,
  type DocAdmin,
} from "../../lib/documentosAdmin";
import type { SlugDocumento } from "../../lib/documentos";
import { CabecalhoTela } from "../../components/painel/CabecalhoTela";
import { Selo } from "../../components/painel/Selo";

/**
 * Editor mínimo dos textos do estudo. O texto real fica só no banco (pré-CEP).
 * Cada slug tem uma versão ativa; alterar o texto deve acompanhar a versão.
 */
export function Documentos() {
  const estudo = useEstudo();
  const [docs, setDocs] = useState<Record<string, DocAdmin> | null>(null);
  const [aberto, setAberto] = useState<SlugDocumento | null>(null);

  useEffect(() => {
    if (estudo) carregarDocsDoEstudo(estudo.id).then(setDocs);
  }, [estudo]);

  if (!estudo || docs === null) return <p role="status">Carregando…</p>;

  return (
    <div>
      <CabecalhoTela sobretitulo={estudo.nome} titulo="Documentos" />

      <div className="lista-docs">
        {SLUGS_DOCUMENTO.map(({ slug, rotulo, nota }) => {
          const atual: DocAdmin =
            docs[slug] ?? {
              id: null,
              slug,
              versao: "1",
              titulo: rotulo,
              corpo_html: "",
              ativo: true,
            };
          return (
            <section key={slug} className="cartao-painel">
              <div className="cartao-painel__corpo">
                <div className="lista-docs__cabeca">
                  <div>
                    <strong>{rotulo}</strong>
                    <span className="lista-cartoes__meta">
                      <Selo tom={docs[slug] ? "sucesso" : "neutro"}>
                        {docs[slug] ? `versão ${atual.versao} · publicado` : "não cadastrado"}
                      </Selo>
                    </span>
                  </div>
                  <button
                    type="button"
                    className="botao botao--secundario"
                    onClick={() => setAberto(aberto === slug ? null : slug)}
                  >
                    {aberto === slug ? "Fechar" : "Editar"}
                  </button>
                </div>
                {nota && <p className="documento__versao">{nota}</p>}
                {aberto === slug && (
                  <EditorDoc
                    studyId={estudo.id}
                    inicial={atual}
                    aoSalvar={async () => {
                      setDocs(await carregarDocsDoEstudo(estudo.id));
                      setAberto(null);
                    }}
                  />
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function EditorDoc({
  studyId,
  inicial,
  aoSalvar,
}: {
  studyId: string;
  inicial: DocAdmin;
  aoSalvar: () => void;
}) {
  const [doc, setDoc] = useState<DocAdmin>(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  return (
    <div className="editor-doc">
      <label className="campo">
        <span className="campo__rotulo">Título</span>
        <input
          type="text"
          value={doc.titulo}
          onChange={(e) => setDoc({ ...doc, titulo: e.target.value })}
        />
      </label>
      <label className="campo">
        <span className="campo__rotulo">Versão</span>
        <input
          type="text"
          value={doc.versao}
          onChange={(e) => setDoc({ ...doc, versao: e.target.value })}
        />
      </label>
      <label className="campo">
        <span className="campo__rotulo">Conteúdo (HTML)</span>
        <textarea
          rows={14}
          value={doc.corpo_html}
          onChange={(e) => setDoc({ ...doc, corpo_html: e.target.value })}
        />
      </label>
      {erro && <p className="erro-caixa">{erro}</p>}
      <button
        type="button"
        className="botao"
        disabled={salvando || !doc.titulo || !doc.corpo_html}
        onClick={async () => {
          setErro(null);
          setSalvando(true);
          const { error } = await salvarDocumento(studyId, doc);
          setSalvando(false);
          if (error) return setErro(error);
          aoSalvar();
        }}
      >
        {salvando ? "Salvando…" : "Salvar versão ativa"}
      </button>
    </div>
  );
}
