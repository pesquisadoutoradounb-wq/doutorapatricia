import { useEffect, useState } from "react";
import { useEstudo } from "./EstudoLayout";
import {
  carregarAudiosAtuais,
  carregarVinhetasDoEstudo,
  enviarAudio,
  type AudioAtual,
  type VinhetaAdmin,
} from "../../lib/audiosAdmin";

/**
 * Upload de 1 áudio de imaginação guiada por vinheta (Storage `audios` +
 * `audio_assets`). O `titulo_interno` e o domínio são visíveis só para a
 * equipe — nunca chegam ao participante.
 */
export function Audios() {
  const estudo = useEstudo();
  const [vinhetas, setVinhetas] = useState<VinhetaAdmin[] | null>(null);
  const [audios, setAudios] = useState<Map<number, AudioAtual>>(new Map());

  async function recarregar(studyId: string) {
    const vs = await carregarVinhetasDoEstudo(studyId);
    setVinhetas(vs);
    setAudios(await carregarAudiosAtuais(vs.map((v) => v.id)));
  }

  useEffect(() => {
    if (estudo) recarregar(estudo.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estudo?.id]);

  if (!estudo || vinhetas === null) return <p role="status">Carregando…</p>;

  return (
    <div>
      <div className="tela-titulo">
        <span className="eyebrow">{estudo.nome}</span>
        <h1>Áudios das vinhetas</h1>
        <hr className="regua" />
      </div>
      <p className="documento__versao">
        Um arquivo por vinheta. Sugerido: MP3, mono, ~128 kbps, curto
        (&lt; ~3 min / &lt; 5 MB). Substituir reenvia o mesmo caminho.
      </p>

      <div className="lista-docs">
        {vinhetas.map((v) => (
          <LinhaAudio
            key={v.id}
            vinheta={v}
            atual={audios.get(v.id) ?? null}
            studySlug={estudo.slug}
            aoEnviar={() => recarregar(estudo.id)}
          />
        ))}
      </div>
    </div>
  );
}

function LinhaAudio({
  vinheta,
  atual,
  studySlug,
  aoEnviar,
}: {
  vinheta: VinhetaAdmin;
  atual: AudioAtual | null;
  studySlug: string;
  aoEnviar: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div className="cartao">
      <div className="lista-docs__cabeca">
        <div>
          <strong>
            Vinheta {vinheta.id} — {vinheta.titulo_interno}
          </strong>
          <span className="documento__versao">
            Domínio {vinheta.dominio} ·{" "}
            {atual
              ? `áudio enviado${atual.duracao_segundos ? ` (${Math.round(atual.duracao_segundos)}s)` : ""}`
              : "sem áudio"}
          </span>
        </div>
      </div>

      {atual && (
        <audio controls src={atual.url} style={{ width: "100%", marginBottom: "var(--espaco-3)" }} />
      )}

      <label className="campo">
        <span className="campo__rotulo">
          {atual ? "Substituir áudio" : "Enviar áudio"}
        </span>
        <input
          type="file"
          accept="audio/*"
          disabled={enviando}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setErro(null);
            setEnviando(true);
            const { error } = await enviarAudio(studySlug, vinheta.id, file);
            setEnviando(false);
            e.target.value = "";
            if (error) return setErro(error);
            aoEnviar();
          }}
        />
      </label>
      {enviando && <p role="status">Enviando…</p>}
      {erro && <p className="erro-caixa">{erro}</p>}
    </div>
  );
}
