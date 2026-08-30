import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DadosParticipante } from "../../lib/participanteContexto";
import { useParticipante } from "../../lib/participanteContexto";
import {
  avancarEtapa,
  encerrarParticipacao,
  rotaDaEtapa,
} from "../../lib/participantSession";
import { useAutosave } from "../../hooks/useAutosave";
import { useVerificacaoAvanco } from "../../hooks/useVerificacaoAvanco";
import { ModalAbandono } from "../../components/participar/ModalAbandono";
import {
  INTRODUCAO_SOCIODEMOGRAFICO,
  SECOES,
  SOCIODEMOGRAFICO,
  alternarSelecaoCheckbox,
  normalizarRespostas,
  questaoVisivel,
  questoesAplicaveis,
  type QuestaoSociodemografico,
  type RespostasSociodemografico,
  type ValorResposta,
} from "../../lib/instrumentos/sociodemografico";
import { avaliarElegibilidade } from "../../lib/instrumentos/elegibilidade";
import {
  carregarRespostasSociodemografico,
  concluirSociodemografico,
  salvarParcialSociodemografico,
} from "../../lib/instrumentos/basais";
import { estaEmBranco } from "../../lib/instrumentos/respostasBranco";

export function Sociodemografico({ p }: { p: DadosParticipante }) {
  const [inicial, setInicial] = useState<RespostasSociodemografico | null | "erro">(
    null,
  );

  useEffect(() => {
    let vivo = true;
    carregarRespostasSociodemografico(p.id)
      .then((r) => vivo && setInicial(r ?? {}))
      .catch(() => vivo && setInicial("erro"));
    return () => {
      vivo = false;
    };
  }, [p.id]);

  if (inicial === null) return <p role="status">Carregando o questionário…</p>;
  if (inicial === "erro") {
    return (
      <div className="erro-caixa">
        Não foi possível carregar o questionário agora. Verifique sua conexão e
        recarregue a página.
      </div>
    );
  }
  return <SociodemograficoInterno p={p} respostasIniciais={inicial} />;
}

function limpar(r: RespostasSociodemografico): RespostasSociodemografico {
  const saida: RespostasSociodemografico = {};
  for (const [k, v] of Object.entries(r)) {
    if (v !== undefined) saida[k as keyof RespostasSociodemografico] = v;
  }
  return saida;
}

function SociodemograficoInterno({
  p,
  respostasIniciais,
}: {
  p: DadosParticipante;
  respostasIniciais: RespostasSociodemografico;
}) {
  const navigate = useNavigate();
  const { recarregar } = useParticipante();
  const autosave = useAutosave();

  const [respostas, setRespostas] = useState<RespostasSociodemografico>(
    respostasIniciais,
  );
  const [faltamObrigatorias, setFaltamObrigatorias] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [concluindo, setConcluindo] = useState(false);
  const primeiroErroRef = useRef<HTMLDivElement>(null);

  const aplicaveis = useMemo(() => questoesAplicaveis(respostas), [respostas]);

  function atualizar(campo: keyof RespostasSociodemografico, valor: ValorResposta) {
    setRespostas((atual) => {
      const proximo = normalizarRespostas({ ...atual, [campo]: valor });
      autosave.agendar(() =>
        salvarParcialSociodemografico(p.id, limpar(proximo)),
      );
      return proximo;
    });
    setFaltamObrigatorias((l) => l.filter((c) => c !== campo));
  }

  const verif = useVerificacaoAvanco(p.id, async () => {
    setConcluindo(true);
    const resultado = avaliarElegibilidade(respostas);
    const { error } = await concluirSociodemografico(p.id, limpar(respostas), resultado);
    if (error) {
      setConcluindo(false);
      setErro("Não foi possível concluir agora. Tente novamente.");
      return;
    }
    if (resultado.elegivel) {
      await avancarEtapa(p.id, "ysq");
      await recarregar();
      navigate(rotaDaEtapa("ysq"), { replace: true });
    } else {
      const r = await encerrarParticipacao(p.id, "inelegivel");
      if (r.error) {
        setConcluindo(false);
        setErro("Não foi possível concluir agora. Tente novamente.");
        return;
      }
      await recarregar();
      navigate(rotaDaEtapa("inelegivel"), { replace: true });
    }
  });

  async function aoConcluir() {
    setErro(null);

    // 1. Obrigatórias (Q1 idade, Q8 UF) — bloqueio duro.
    const faltando = SOCIODEMOGRAFICO.filter(
      (q) => q.obrigatoria && estaEmBranco(respostas[q.campo]),
    ).map((q) => q.campo);
    if (faltando.length > 0) {
      setFaltamObrigatorias(faltando);
      primeiroErroRef.current?.scrollIntoView({ block: "center" });
      return;
    }

    // 2. Grava tudo o que estiver pendente antes de seguir.
    const ok = await autosave.flush();
    if (!ok) {
      setErro("Não foi possível salvar suas respostas. Verifique sua conexão.");
      return;
    }

    // 3. Verificação de respostas em branco (aviso / modal).
    const valores = aplicaveis
      .filter((q) => !q.obrigatoria)
      .map((q) => respostas[q.campo]);
    await verif.tentarAvancar(valores);
  }

  return (
    <div>
      <div className="tela-titulo">
        <span className="eyebrow">Questionário</span>
        <h1>Questionário Sociodemográfico e Clínico</h1>
        <hr className="regua" />
      </div>
      <p className="socio-introducao">{INTRODUCAO_SOCIODEMOGRAFICO}</p>

      {(["A", "B", "C"] as const).map((secao) => (
        <section key={secao} className="socio-secao">
          <h2>
            {secao}. {SECOES[secao]}
          </h2>
          {SOCIODEMOGRAFICO.filter(
            (q) => q.secao === secao && questaoVisivel(q, respostas),
          ).map((q) => (
            <CampoQuestao
              key={q.campo}
              q={q}
              valor={respostas[q.campo]}
              faltando={faltamObrigatorias.includes(q.campo)}
              avisoBranco={
                verif.aviso && !q.obrigatoria && estaEmBranco(respostas[q.campo])
              }
              onChange={(v) => atualizar(q.campo, v)}
              refPrimeiroErro={
                faltamObrigatorias[0] === q.campo ? primeiroErroRef : undefined
              }
            />
          ))}
        </section>
      ))}

      {faltamObrigatorias.length > 0 && (
        <p className="erro-caixa" role="alert">
          Responda as questões destacadas para continuar (idade e unidade da
          federação são obrigatórias).
        </p>
      )}
      {verif.aviso && (
        <p className="aviso" role="alert">
          Há questões sem resposta. Toque em “Concluir” novamente para seguir
          assim mesmo.
        </p>
      )}
      {erro && <p className="erro-caixa">{erro}</p>}

      <div style={{ marginTop: "var(--espaco-6)" }}>
        <button
          type="button"
          className="botao"
          disabled={concluindo}
          onClick={aoConcluir}
        >
          {concluindo ? "Concluindo…" : "Concluir"}
        </button>
      </div>

      <ModalAbandono
        aberto={verif.modalAberto}
        confirmando={verif.confirmando}
        onCancelar={verif.cancelarAbandono}
        onConfirmar={verif.confirmarAbandono}
      />
      {verif.erroAbandono && <p className="erro-caixa">{verif.erroAbandono}</p>}
    </div>
  );
}

function CampoQuestao({
  q,
  valor,
  faltando,
  avisoBranco,
  onChange,
  refPrimeiroErro,
}: {
  q: QuestaoSociodemografico;
  valor: ValorResposta;
  faltando: boolean;
  avisoBranco: boolean;
  onChange: (valor: ValorResposta) => void;
  refPrimeiroErro?: React.RefObject<HTMLDivElement>;
}) {
  const classe = `socio-campo${faltando ? " socio-campo--erro" : ""}${
    avisoBranco ? " socio-campo--branco" : ""
  }`;
  const selecionados = Array.isArray(valor) ? valor : [];

  return (
    <div className={classe} ref={refPrimeiroErro}>
      <span className="socio-campo__rotulo">
        {q.numero}. {q.enunciado}
        {q.obrigatoria && <span className="socio-campo__obrig"> *</span>}
      </span>
      {q.ajuda && <span className="socio-campo__ajuda">{q.ajuda}</span>}

      {q.tipo === "numero" && (
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={130}
          value={typeof valor === "number" ? valor : ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
        />
      )}

      {q.tipo === "texto" && (
        <input
          type="text"
          value={typeof valor === "string" ? valor : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {q.tipo === "select" && (
        <select
          value={typeof valor === "string" ? valor : ""}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">Selecione…</option>
          {q.opcoes?.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
      )}

      {q.tipo === "radio" && (
        <div className="socio-opcoes">
          {q.opcoes?.map((o) => (
            <label key={o.valor} className="socio-opcao">
              <input
                type="radio"
                name={q.campo}
                value={o.valor}
                checked={valor === o.valor}
                onChange={() => onChange(o.valor)}
              />
              <span>{o.rotulo}</span>
            </label>
          ))}
        </div>
      )}

      {q.tipo === "checkbox" && (
        <div className="socio-opcoes">
          {q.opcoes?.map((o) => (
            <label key={o.valor} className="socio-opcao">
              <input
                type="checkbox"
                checked={selecionados.includes(o.valor)}
                onChange={() =>
                  onChange(
                    alternarSelecaoCheckbox(selecionados, o.valor, q.opcoes ?? []),
                  )
                }
              />
              <span>{o.rotulo}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
