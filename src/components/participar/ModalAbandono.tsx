import { useEffect, useRef } from "react";
import { TEXTO_MODAL_ABANDONO } from "../../lib/instrumentos/respostasBranco";

/**
 * Modal de abandono (PERGUNTAR 19). Aparece ao tentar avançar com 2+ respostas
 * em branco. "Cancelar" volta às questões; "Sim" encerra a participação
 * (etapa_atual → 'interrompido').
 */
export function ModalAbandono({
  aberto,
  onCancelar,
  onConfirmar,
  confirmando = false,
}: {
  aberto: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
  confirmando?: boolean;
}) {
  const cancelarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;
    cancelarRef.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, onCancelar]);

  if (!aberto) return null;

  return (
    <div className="modal-fundo" onClick={onCancelar}>
      <div
        className="modal-cartao"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-abandono-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-abandono-titulo">Interromper a participação?</h2>
        <p>{TEXTO_MODAL_ABANDONO}</p>
        <p className="modal-cartao__nota">
          Toque em <strong>Cancelar</strong> para seguir com a pesquisa,
          retornando às questões anteriores, ou em <strong>Sim</strong> para
          cancelar sua participação.
        </p>
        <div className="modal-cartao__acoes">
          <button
            type="button"
            className="botao botao--secundario"
            ref={cancelarRef}
            onClick={onCancelar}
            disabled={confirmando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="botao botao--perigo"
            onClick={onConfirmar}
            disabled={confirmando}
          >
            {confirmando ? "Encerrando…" : "Sim, cancelar minha participação"}
          </button>
        </div>
      </div>
    </div>
  );
}
