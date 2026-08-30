# Sub-projeto E3 — Pontuação & resultados · Design

**Estudo 1 (UnB)** · Data: 2026-08-29 · Status: aprovado para implementação

---

## Escopo

Cálculo dos escores dos instrumentos basais e uma tela de **Resultados** no
painel. Os escores também entram nas exportações (E2).

**Entra:** YSQ-S3 (18 esquemas / 5 domínios: total e média), PANAS (afeto
positivo / negativo: soma e média), tela agregada, colunas de escore no export.
**Fica de fora:** classificação/pontos de corte do YSQ (a pesquisadora vai
explicar por áudio) e as faixas do PANAS (inconsistentes — ver pendência);
análises inferenciais; escore da avaliação pós-imaginação.

## Decisões (autônomas)

| Tema | Decisão |
|---|---|
| Mapa YSQ | Esquema `s` (1..18) = itens `{s, s+18, s+36, s+54, s+72}` (fórmula da folha de correção). Domínios: **D1** 1–5 · **D2** 6–9 · **D3** 14,15 · **D4** 10,11,16 · **D5** 12,13,17,18. |
| Escore YSQ | Por esquema: `total` (soma dos itens respondidos) e `media` (total ÷ respondidos). Por domínio: `total` e `media` sobre todos os itens do domínio. Itens em branco não entram na média. |
| Mapa PANAS | **PA** = itens 1–9 (Ativo…Forte); **NA** = itens 10–19 (Com medo…Chateado). Soma e média. **Sem faixas** — as da pesquisadora (0–13/14–27/28–40) não fecham com 9+10 itens; pendente do áudio dela. |
| Onde | Puro em `src/lib/pontuacao.ts`; nada no banco (mesma linha de `painelMetricas`). |
| Tela | `/painel/estudos/:id/resultados` — barras de média por domínio (YSQ), tabela de média por esquema, cartões PA/NA médios, N. Alternador piloto. |
| Export | E2 ganha `ysq_escores` e `panas_escores` (um por participante). |

## `src/lib/pontuacao.ts`

```ts
ESQUEMAS_YSQ: { indice:1..18, chave, nome, dominio:1..5 }[]
DOMINIOS_YSQ: { indice:1..5, nome }[]
itensDoEsquema(indice): number[]                       // {s, s+18, ...}
escoreYsq(valores: Map<number, number>): {
  esquemas: { indice, nome, dominio, total, media, respondidos }[]
  dominios: { indice, nome, total, media, respondidos }[]
}
PANAS_PA = [1..9]; PANAS_NA = [10..19]
escorePanas(valores: Map<number, number>): {
  paTotal, naTotal, paMedia, naMedia, paRespondidos, naRespondidos
}
```

Agregação para a tela: média dos escores entre participantes (ignora quem não
respondeu o instrumento).

## Tela `Resultados.tsx`

- `AlternadorModo`; carrega `ysq_item_responses` + `panas_item_responses` dos
  participantes de produção não-descartados (via ids, como o export).
- YSQ: `BarrasH` "Média por domínio" (5) + tabela "Média por esquema" (18,
  ordenada por média desc).
- PANAS: `CartaoKPI` PA médio, NA médio, N; nota sobre as faixas pendentes.
- Vazio → "ainda sem respostas".

Item novo na `Sidebar`: `{ to: "resultados", rotulo: "Resultados" }` + rota.

## Testes

- `itensDoEsquema(1)` = [1,19,37,55,73]; `(18)` = [18,36,54,72,90].
- `escoreYsq`: soma/média por esquema; item em branco reduz `respondidos` e não
  ent(a) na média; domínio D3 = esquemas 14,15.
- `escorePanas`: PA = soma 1–9, NA = soma 10–19; respostas parciais.
