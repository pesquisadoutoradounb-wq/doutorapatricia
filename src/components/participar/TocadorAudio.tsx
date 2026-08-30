import { useEffect, useRef, useState } from "react";

export interface TelemetriaAudio {
  iniciadoEm: string | null;
  terminadoEm: string | null;
  duracaoOuvidaSeg: number;
  completou: boolean;
}

/**
 * Áudio de imaginação guiada. "Continuar" aparece quando o áudio termina; um
 * link discreto "já ouvi, continuar" aparece ~10 s após o play (escape de
 * piloto — PERGUNTAR 13/14). Áudio ausente: aviso + continuar imediato.
 * Registra início/fim, duração ouvida e se completou.
 */
export function TocadorAudio({
  url,
  onContinuar,
}: {
  url: string | null;
  onContinuar: (t: TelemetriaAudio) => void;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const iniciadoEm = useRef<string | null>(null);
  const ouvidoSeg = useRef(0);
  const ultimoTime = useRef(0);
  const [terminou, setTerminou] = useState(false);
  const [mostrarEscape, setMostrarEscape] = useState(false);
  const [erroMidia, setErroMidia] = useState(false);

  useEffect(() => {
    if (!url) return;
    const t = setTimeout(() => setMostrarEscape(true), 10_000);
    return () => clearTimeout(t);
  }, [url]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !url) return;
    try {
      // autoplay pode ser bloqueado (ou não implementado no jsdom): o
      // participante usa os controles nativos.
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {
      /* ignore */
    }
  }, [url]);

  function telemetria(completou: boolean): TelemetriaAudio {
    return {
      iniciadoEm: iniciadoEm.current,
      terminadoEm: completou ? new Date().toISOString() : null,
      duracaoOuvidaSeg: Math.round(ouvidoSeg.current * 10) / 10,
      completou,
    };
  }

  if (!url || erroMidia) {
    return (
      <div className="tocador-audio">
        <p className="aviso">
          O áudio desta situação ainda não está disponível. Você pode continuar.
        </p>
        <button
          type="button"
          className="botao"
          onClick={() =>
            onContinuar({
              iniciadoEm: null,
              terminadoEm: null,
              duracaoOuvidaSeg: 0,
              completou: false,
            })
          }
        >
          Continuar
        </button>
      </div>
    );
  }

  return (
    <div className="tocador-audio">
      <audio
        ref={ref}
        src={url}
        controls
        onPlay={() => {
          if (!iniciadoEm.current) iniciadoEm.current = new Date().toISOString();
        }}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          if (t > ultimoTime.current && t - ultimoTime.current < 1.5) {
            ouvidoSeg.current += t - ultimoTime.current;
          }
          ultimoTime.current = t;
        }}
        onEnded={() => setTerminou(true)}
        onError={() => setErroMidia(true)}
      />
      <p className="tocador-audio__nota">
        Quando estiver em um local seguro e confortável, feche os olhos e siga a
        instrução do áudio.
      </p>

      {terminou ? (
        <button
          type="button"
          className="botao"
          onClick={() => onContinuar(telemetria(true))}
        >
          Continuar
        </button>
      ) : (
        mostrarEscape && (
          <button
            type="button"
            className="botao botao--secundario"
            onClick={() => onContinuar(telemetria(false))}
          >
            Já ouvi, continuar
          </button>
        )
      )}
    </div>
  );
}
