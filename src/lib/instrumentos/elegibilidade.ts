/**
 * Avaliação de elegibilidade a partir das respostas do sociodemográfico
 * (PERGUNTAR 7). O participante responde o questionário inteiro; a avaliação
 * só roda no "Concluir". Inelegível se:
 *   - idade < 18 anos (Q1);
 *   - Q15 (acesso à internet) = "Não";
 *   - Q17 (dispositivo permite áudio) = "Não";  ("Não sei" NÃO reprova — default)
 *   - Q18 (compreende português) = "Não".
 */
import type { RespostasSociodemografico } from "./sociodemografico";

export const IDADE_MINIMA = 18;

export type MotivoInelegibilidade =
  | "idade_menor_18"
  | "sem_acesso_internet"
  | "dispositivo_sem_audio"
  | "nao_compreende_portugues";

export const ROTULO_MOTIVO: Record<MotivoInelegibilidade, string> = {
  idade_menor_18: "Idade inferior a 18 anos",
  sem_acesso_internet: "Sem acesso regular à internet",
  dispositivo_sem_audio: "Dispositivo não permite ouvir áudio",
  nao_compreende_portugues: "Não compreende textos em português sem auxílio",
};

export interface ResultadoElegibilidade {
  elegivel: boolean;
  motivos: MotivoInelegibilidade[];
}

export function avaliarElegibilidade(
  r: RespostasSociodemografico,
): ResultadoElegibilidade {
  const motivos: MotivoInelegibilidade[] = [];

  const idade = r.q1_idade;
  if (typeof idade === "number" && Number.isFinite(idade) && idade < IDADE_MINIMA) {
    motivos.push("idade_menor_18");
  }
  if (r.q15_acesso_internet === "nao") motivos.push("sem_acesso_internet");
  if (r.q17_dispositivo_audio === "nao") motivos.push("dispositivo_sem_audio");
  if (r.q18_compreende_portugues === "nao") motivos.push("nao_compreende_portugues");

  return { elegivel: motivos.length === 0, motivos };
}
