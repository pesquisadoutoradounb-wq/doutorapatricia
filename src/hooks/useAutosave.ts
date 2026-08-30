import { useCallback, useEffect, useRef, useState } from "react";

export type EstadoAutosave = "ocioso" | "pendente" | "salvando" | "salvo" | "erro";

type Gravacao = () => Promise<{ error: unknown }>;

/**
 * Autosave com debounce e um único slot pendente. Pensado para gravações
 * idempotentes que sempre enviam o estado completo (upsert de linha), de modo
 * que substituir a gravação pendente pela mais recente nunca perde dados.
 *
 * `flush()` grava imediatamente o que estiver pendente e resolve com `true` em
 * caso de sucesso (ou se nada havia a gravar) e `false` em caso de falha —
 * use antes de avançar de tela.
 */
export function useAutosave(atrasoMs = 600) {
  const [estado, setEstado] = useState<EstadoAutosave>("ocioso");
  const pendente = useRef<Gravacao | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const executar = useCallback(async (): Promise<boolean> => {
    const fn = pendente.current;
    if (!fn) return true;
    pendente.current = null;
    setEstado("salvando");
    try {
      const { error } = await fn();
      if (error) {
        pendente.current = fn;
        setEstado("erro");
        return false;
      }
      setEstado("salvo");
      return true;
    } catch {
      pendente.current = fn;
      setEstado("erro");
      return false;
    }
  }, []);

  const agendar = useCallback(
    (gravacao: Gravacao) => {
      pendente.current = gravacao;
      setEstado("pendente");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void executar(), atrasoMs);
    },
    [executar, atrasoMs],
  );

  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) clearTimeout(timer.current);
    return executar();
  }, [executar]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { estado, agendar, flush };
}
