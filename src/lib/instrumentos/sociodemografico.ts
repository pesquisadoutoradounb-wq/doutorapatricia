/**
 * Questionário Sociodemográfico e Clínico — estrutura e texto.
 *
 * É conteúdo redigido pela própria pesquisadora (não instrumento com direitos
 * autorais), então vive no bundle como schema tipado. Só o valor do salário
 * mínimo é parametrizável. Correções da pesquisadora aplicadas (PERGUNTAR 4, 5,
 * 6, 8): "federação", Q8 = lista de UFs, Q9 sem a meta-frase do autor.
 *
 * Cada `campo` casa 1:1 com uma coluna de `sociodemographic_responses`.
 * "Prefiro não responder" é gravado como a string 'prefiro_nao_responder',
 * nunca NULL (NULL = ainda não respondido).
 */
import { SIGLAS_UF, UF_FORA_DO_BRASIL } from "./ufs";

/** Valor exibido no enunciado da Q9. Parametrizável sem mudar o schema. */
export const SALARIO_MINIMO_REFERENCIA = "R$ 1.621,00";

export const PREFIRO_NAO_RESPONDER = "prefiro_nao_responder";
export const NAO_SEI_INFORMAR = "nao_sei_informar";

export type CampoSociodemografico =
  | "q1_idade"
  | "q2_sexo_registrado"
  | "q3_identidade_genero"
  | "q3_identidade_genero_outra"
  | "q4_cor_raca"
  | "q5_estado_conjugal"
  | "q5_estado_conjugal_outro"
  | "q6_escolaridade"
  | "q7_ocupacao"
  | "q7_ocupacao_outra"
  | "q8_uf"
  | "q8_pais"
  | "q9_renda_familiar"
  | "q10_psicoterapia_atual"
  | "q10_tempo"
  | "q11_psicoterapia_anterior"
  | "q12_psiquiatra_atual"
  | "q13_medicacao_atual"
  | "q13_medicacao_quais"
  | "q14_diagnostico_informado"
  | "q14_diagnosticos"
  | "q14_diagnostico_outro"
  | "q15_acesso_internet"
  | "q16_dispositivos"
  | "q16_dispositivo_outro"
  | "q17_dispositivo_audio"
  | "q18_compreende_portugues";

export type ValorResposta = string | number | string[] | null | undefined;

export type RespostasSociodemografico = Partial<
  Record<CampoSociodemografico, ValorResposta>
>;

export interface OpcaoSociodemografico {
  valor: string;
  rotulo: string;
  /** Numa questão de checkbox, marcar esta opção limpa e desabilita as demais. */
  exclusiva?: boolean;
}

export interface QuestaoSociodemografico {
  campo: CampoSociodemografico;
  numero: string;
  secao: "A" | "B" | "C";
  enunciado: string;
  ajuda?: string;
  tipo: "numero" | "radio" | "select" | "checkbox" | "texto";
  opcoes?: OpcaoSociodemografico[];
  obrigatoria?: boolean;
  /** A questão só aparece quando o predicado sobre outra resposta é verdadeiro. */
  depende?: {
    campo: CampoSociodemografico;
    satisfaz: (valor: ValorResposta) => boolean;
  };
}

const SIM_NAO_PNR: OpcaoSociodemografico[] = [
  { valor: "sim", rotulo: "Sim" },
  { valor: "nao", rotulo: "Não" },
  { valor: PREFIRO_NAO_RESPONDER, rotulo: "Prefiro não responder" },
];

const igualA = (esperado: string) => (v: ValorResposta) => v === esperado;
const inclui = (esperado: string) => (v: ValorResposta) =>
  Array.isArray(v) && v.includes(esperado);

export const SECOES: Record<"A" | "B" | "C", string> = {
  A: "Informações sociodemográficas",
  B: "Informações sobre saúde mental e acompanhamento profissional",
  C: "Condições para participação na pesquisa",
};

export const INTRODUCAO_SOCIODEMOGRAFICO =
  "As perguntas a seguir têm como objetivo conhecer algumas características das " +
  "pessoas que participam da pesquisa. As informações serão analisadas de forma " +
  "confidencial e utilizadas exclusivamente para fins científicos. Nas questões " +
  "em que houver a opção “Prefiro não responder”, você poderá selecioná-la caso " +
  "não deseje fornecer a informação.";

export const SOCIODEMOGRAFICO: QuestaoSociodemografico[] = [
  {
    campo: "q1_idade",
    numero: "1",
    secao: "A",
    enunciado: "Qual é a sua idade?",
    ajuda: "Em anos completos.",
    tipo: "numero",
    obrigatoria: true,
  },
  {
    campo: "q2_sexo_registrado",
    numero: "2",
    secao: "A",
    enunciado: "Qual foi seu sexo registrado ao nascer?",
    tipo: "radio",
    opcoes: [
      { valor: "feminino", rotulo: "Feminino" },
      { valor: "masculino", rotulo: "Masculino" },
      { valor: "intersexo", rotulo: "Intersexo" },
      { valor: PREFIRO_NAO_RESPONDER, rotulo: "Prefiro não responder" },
    ],
  },
  {
    campo: "q3_identidade_genero",
    numero: "3",
    secao: "A",
    enunciado: "Qual é sua identidade de gênero?",
    tipo: "radio",
    opcoes: [
      { valor: "mulher_cis", rotulo: "Mulher cisgênero" },
      { valor: "homem_cis", rotulo: "Homem cisgênero" },
      { valor: "mulher_trans", rotulo: "Mulher transgênero" },
      { valor: "homem_trans", rotulo: "Homem transgênero" },
      { valor: "nao_binaria", rotulo: "Pessoa não binária" },
      { valor: "outra", rotulo: "Outra" },
      { valor: PREFIRO_NAO_RESPONDER, rotulo: "Prefiro não responder" },
    ],
  },
  {
    campo: "q3_identidade_genero_outra",
    numero: "3",
    secao: "A",
    enunciado: "Qual?",
    tipo: "texto",
    depende: { campo: "q3_identidade_genero", satisfaz: igualA("outra") },
  },
  {
    campo: "q4_cor_raca",
    numero: "4",
    secao: "A",
    enunciado: "Como você se considera em relação à cor ou raça?",
    tipo: "radio",
    opcoes: [
      { valor: "branca", rotulo: "Branca" },
      { valor: "preta", rotulo: "Preta" },
      { valor: "parda", rotulo: "Parda" },
      { valor: "amarela", rotulo: "Amarela" },
      { valor: "indigena", rotulo: "Indígena" },
      { valor: PREFIRO_NAO_RESPONDER, rotulo: "Prefiro não responder" },
    ],
  },
  {
    campo: "q5_estado_conjugal",
    numero: "5",
    secao: "A",
    enunciado: "Qual é seu estado conjugal atual?",
    tipo: "radio",
    opcoes: [
      { valor: "solteiro", rotulo: "Solteiro(a)" },
      { valor: "casado_uniao", rotulo: "Casado(a) ou em união estável" },
      { valor: "separado_divorciado", rotulo: "Separado(a) ou divorciado(a)" },
      { valor: "viuvo", rotulo: "Viúvo(a)" },
      { valor: "outro", rotulo: "Outro" },
      { valor: PREFIRO_NAO_RESPONDER, rotulo: "Prefiro não responder" },
    ],
  },
  {
    campo: "q5_estado_conjugal_outro",
    numero: "5",
    secao: "A",
    enunciado: "Qual?",
    tipo: "texto",
    depende: { campo: "q5_estado_conjugal", satisfaz: igualA("outro") },
  },
  {
    campo: "q6_escolaridade",
    numero: "6",
    secao: "A",
    enunciado: "Qual é o nível mais elevado de escolaridade que você concluiu?",
    tipo: "radio",
    opcoes: [
      { valor: "fundamental_incompleto", rotulo: "Ensino fundamental incompleto" },
      { valor: "fundamental_completo", rotulo: "Ensino fundamental completo" },
      { valor: "medio_incompleto", rotulo: "Ensino médio incompleto" },
      { valor: "medio_completo", rotulo: "Ensino médio completo" },
      { valor: "superior_incompleto", rotulo: "Ensino superior incompleto" },
      { valor: "superior_completo", rotulo: "Ensino superior completo" },
      { valor: "pos_graduacao", rotulo: "Pós-graduação" },
      { valor: PREFIRO_NAO_RESPONDER, rotulo: "Prefiro não responder" },
    ],
  },
  {
    campo: "q7_ocupacao",
    numero: "7",
    secao: "A",
    enunciado: "Qual é sua situação ocupacional atual?",
    ajuda: "Marque a principal.",
    tipo: "radio",
    opcoes: [
      { valor: "vinculo_formal", rotulo: "Trabalho com vínculo formal" },
      { valor: "sem_vinculo_autonomo", rotulo: "Trabalho sem vínculo formal / autônomo(a)" },
      { valor: "empresario", rotulo: "Empresário(a) / empreendedor(a)" },
      { valor: "estudante", rotulo: "Estudante" },
      { valor: "desempregado", rotulo: "Desempregado(a)" },
      { valor: "aposentado_pensionista", rotulo: "Aposentado(a) / pensionista" },
      { valor: "sem_atividade_remunerada", rotulo: "Não exerço atividade remunerada atualmente" },
      { valor: "outra", rotulo: "Outra" },
      { valor: PREFIRO_NAO_RESPONDER, rotulo: "Prefiro não responder" },
    ],
  },
  {
    campo: "q7_ocupacao_outra",
    numero: "7",
    secao: "A",
    enunciado: "Qual?",
    tipo: "texto",
    depende: { campo: "q7_ocupacao", satisfaz: igualA("outra") },
  },
  {
    campo: "q8_uf",
    numero: "8",
    secao: "A",
    enunciado: "Em qual estado ou unidade da federação você reside atualmente?",
    tipo: "select",
    obrigatoria: true,
    opcoes: [
      ...SIGLAS_UF.map((s) => ({ valor: s, rotulo: s })),
      { valor: UF_FORA_DO_BRASIL, rotulo: "Resido fora do Brasil" },
    ],
  },
  {
    campo: "q8_pais",
    numero: "8",
    secao: "A",
    enunciado: "País:",
    tipo: "texto",
    depende: { campo: "q8_uf", satisfaz: igualA(UF_FORA_DO_BRASIL) },
  },
  {
    campo: "q9_renda_familiar",
    numero: "9",
    secao: "A",
    enunciado: "Aproximadamente, qual é a renda mensal total da sua família?",
    tipo: "radio",
    opcoes: [
      { valor: "ate_1", rotulo: `Até 1 salário mínimo (${SALARIO_MINIMO_REFERENCIA})` },
      { valor: "1_a_2", rotulo: "Mais de 1 até 2 salários mínimos" },
      { valor: "2_a_3", rotulo: "Mais de 2 até 3 salários mínimos" },
      { valor: "3_a_5", rotulo: "Mais de 3 até 5 salários mínimos" },
      { valor: "5_a_10", rotulo: "Mais de 5 até 10 salários mínimos" },
      { valor: "10_a_20", rotulo: "Mais de 10 até 20 salários mínimos" },
      { valor: "mais_20", rotulo: "Mais de 20 salários mínimos" },
      { valor: NAO_SEI_INFORMAR, rotulo: "Não sei informar" },
      { valor: PREFIRO_NAO_RESPONDER, rotulo: "Prefiro não responder" },
    ],
  },
  {
    campo: "q10_psicoterapia_atual",
    numero: "10",
    secao: "B",
    enunciado: "Você está realizando psicoterapia atualmente?",
    tipo: "radio",
    opcoes: SIM_NAO_PNR,
  },
  {
    campo: "q10_tempo",
    numero: "10",
    secao: "B",
    enunciado: "Há quanto tempo aproximadamente?",
    tipo: "radio",
    depende: { campo: "q10_psicoterapia_atual", satisfaz: igualA("sim") },
    opcoes: [
      { valor: "menos_3_meses", rotulo: "Menos de 3 meses" },
      { valor: "3_a_6_meses", rotulo: "De 3 a 6 meses" },
      { valor: "7_a_12_meses", rotulo: "De 7 a 12 meses" },
      { valor: "mais_1_ano", rotulo: "Mais de 1 ano" },
      { valor: NAO_SEI_INFORMAR, rotulo: "Não sei informar" },
    ],
  },
  {
    campo: "q11_psicoterapia_anterior",
    numero: "11",
    secao: "B",
    enunciado: "Você já realizou psicoterapia anteriormente?",
    tipo: "radio",
    opcoes: SIM_NAO_PNR,
  },
  {
    campo: "q12_psiquiatra_atual",
    numero: "12",
    secao: "B",
    enunciado: "Você realiza atualmente acompanhamento com médico(a) psiquiatra?",
    tipo: "radio",
    opcoes: SIM_NAO_PNR,
  },
  {
    campo: "q13_medicacao_atual",
    numero: "13",
    secao: "B",
    enunciado:
      "Você utiliza atualmente algum medicamento prescrito para questões " +
      "relacionadas à saúde mental ou emocional?",
    tipo: "radio",
    opcoes: SIM_NAO_PNR,
  },
  {
    campo: "q13_medicacao_quais",
    numero: "13",
    secao: "B",
    enunciado: "Qual(is)?",
    tipo: "texto",
    depende: { campo: "q13_medicacao_atual", satisfaz: igualA("sim") },
  },
  {
    campo: "q14_diagnostico_informado",
    numero: "14",
    secao: "B",
    enunciado:
      "Algum profissional de saúde já lhe informou que você possui algum " +
      "diagnóstico relacionado à saúde mental?",
    tipo: "radio",
    opcoes: [
      { valor: "sim", rotulo: "Sim" },
      { valor: "nao", rotulo: "Não" },
      { valor: NAO_SEI_INFORMAR, rotulo: "Não sei informar" },
      { valor: PREFIRO_NAO_RESPONDER, rotulo: "Prefiro não responder" },
    ],
  },
  {
    campo: "q14_diagnosticos",
    numero: "14",
    secao: "B",
    enunciado: "Qual(is)?",
    ajuda: "Marque todas as opções aplicáveis.",
    tipo: "checkbox",
    depende: { campo: "q14_diagnostico_informado", satisfaz: igualA("sim") },
    opcoes: [
      { valor: "ansiedade", rotulo: "Transtorno de ansiedade" },
      { valor: "depressivo", rotulo: "Transtorno depressivo" },
      { valor: "toc", rotulo: "Transtorno obsessivo-compulsivo" },
      { valor: "trauma_estresse", rotulo: "Transtorno relacionado a trauma ou estresse" },
      { valor: "bipolar", rotulo: "Transtorno bipolar" },
      { valor: "alimentar", rotulo: "Transtorno alimentar" },
      { valor: "tdah", rotulo: "Transtorno de déficit de atenção/hiperatividade (TDAH)" },
      { valor: "outro", rotulo: "Outro" },
      { valor: NAO_SEI_INFORMAR, rotulo: "Não sei informar", exclusiva: true },
      { valor: PREFIRO_NAO_RESPONDER, rotulo: "Prefiro não responder", exclusiva: true },
    ],
  },
  {
    campo: "q14_diagnostico_outro",
    numero: "14",
    secao: "B",
    enunciado: "Qual?",
    tipo: "texto",
    depende: { campo: "q14_diagnosticos", satisfaz: inclui("outro") },
  },
  {
    campo: "q15_acesso_internet",
    numero: "15",
    secao: "C",
    enunciado: "Você possui acesso regular à internet?",
    tipo: "radio",
    opcoes: [
      { valor: "sim", rotulo: "Sim" },
      { valor: "nao", rotulo: "Não" },
    ],
  },
  {
    campo: "q16_dispositivos",
    numero: "16",
    secao: "C",
    enunciado:
      "Qual(is) dispositivo(s) você poderá utilizar para participar desta pesquisa?",
    ajuda: "Pode marcar mais de uma opção.",
    tipo: "checkbox",
    opcoes: [
      { valor: "smartphone", rotulo: "Smartphone" },
      { valor: "tablet", rotulo: "Tablet" },
      { valor: "computador", rotulo: "Computador / notebook" },
      { valor: "outro", rotulo: "Outro" },
    ],
  },
  {
    campo: "q16_dispositivo_outro",
    numero: "16",
    secao: "C",
    enunciado: "Qual?",
    tipo: "texto",
    depende: { campo: "q16_dispositivos", satisfaz: inclui("outro") },
  },
  {
    campo: "q17_dispositivo_audio",
    numero: "17",
    secao: "C",
    enunciado: "Seu dispositivo permite ouvir arquivos de áudio?",
    tipo: "radio",
    opcoes: [
      { valor: "sim", rotulo: "Sim" },
      { valor: "nao", rotulo: "Não" },
      { valor: "nao_sei", rotulo: "Não sei" },
    ],
  },
  {
    campo: "q18_compreende_portugues",
    numero: "18",
    secao: "C",
    enunciado:
      "Você consegue compreender textos escritos em português sem auxílio de " +
      "outra pessoa?",
    tipo: "radio",
    opcoes: [
      { valor: "sim", rotulo: "Sim" },
      { valor: "nao", rotulo: "Não" },
    ],
  },
];

/** Uma questão está visível se não tem `depende` ou se o predicado é satisfeito. */
export function questaoVisivel(
  q: QuestaoSociodemografico,
  respostas: RespostasSociodemografico,
): boolean {
  if (!q.depende) return true;
  return q.depende.satisfaz(respostas[q.depende.campo]);
}

/** Questões atualmente aplicáveis (visíveis) para o conjunto de respostas. */
export function questoesAplicaveis(
  respostas: RespostasSociodemografico,
): QuestaoSociodemografico[] {
  return SOCIODEMOGRAFICO.filter((q) => questaoVisivel(q, respostas));
}

/**
 * Ao mudar uma resposta, as respostas de questões que deixaram de estar
 * visíveis são limpas (não fazem mais sentido e não devem ser gravadas).
 */
export function normalizarRespostas(
  respostas: RespostasSociodemografico,
): RespostasSociodemografico {
  const saida: RespostasSociodemografico = { ...respostas };
  for (const q of SOCIODEMOGRAFICO) {
    if (!questaoVisivel(q, saida) && saida[q.campo] != null) {
      saida[q.campo] = q.tipo === "checkbox" ? [] : null;
    }
  }
  return saida;
}

/**
 * Marca/desmarca um valor numa questão de checkbox, respeitando opções
 * exclusivas: marcar uma exclusiva descarta as demais; marcar uma comum
 * descarta qualquer exclusiva já marcada.
 */
export function alternarSelecaoCheckbox(
  selecionados: string[],
  valor: string,
  opcoes: OpcaoSociodemografico[],
): string[] {
  const jaMarcado = selecionados.includes(valor);
  if (jaMarcado) return selecionados.filter((v) => v !== valor);

  const exclusivas = new Set(
    opcoes.filter((o) => o.exclusiva).map((o) => o.valor),
  );
  if (exclusivas.has(valor)) return [valor];
  return [...selecionados.filter((v) => !exclusivas.has(v)), valor];
}
