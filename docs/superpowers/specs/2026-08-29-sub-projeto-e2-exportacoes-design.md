# Sub-projeto E2 — Exportações anonimizadas · Design

**Estudo 1 (UnB)** · Data: 2026-08-29 · Status: aprovado para implementação

---

## Escopo

Tela **Exportar** do painel: baixar os dados de pesquisa por `participant_id`
(pseudônimo), **sem e-mail nem nome**, para análise externa. Respeita a
separação piloto/produção (padrão: só produção, exclui descartados).

**Entra:** CSVs por conjunto + um JSON "tudo". **Fica de fora:** escores
(E3, mas o export de E3 acrescenta as colunas de escore), agendamento,
formatos além de CSV/JSON.

## Decisões (autônomas)

| Tema | Decisão |
|---|---|
| Formato | Um CSV por conjunto (download separado) + um JSON com tudo. Sem ZIP (evita dependência). |
| Identificador | `participant_id` (uuid — é o pseudônimo, não reidentifica) + `modo`. Nunca e-mail/nome. |
| YSQ / PANAS | Formato **longo** (`participant_id, item, valor`) — melhor para análise; o wide sai do JSON se precisar. |
| Consentimento | `decisao`, `tcle_versao`, `registrado_em`. **Sem** o snapshot do texto (grande, redundante). |
| Filtro | `AlternadorModo` (incluir pilotos) + sempre exclui `descartado`. |
| Download | `Blob` + `<a download>` no cliente; nome `estudo1_<conjunto>_<AAAA-MM-DD>.csv`. |

## Dados exportados

| Conjunto | Origem | Colunas |
|---|---|---|
| participantes | `participants` | participant_id, modo, etapa_atual, criado_em, concluido_em, elegivel, inelegibilidade_motivos |
| sociodemografico | `sociodemographic_responses` | participant_id + todas as colunas `q*` + completado_em |
| ysq | `ysq_item_responses` | participant_id, item, valor, respondido_em |
| panas | `panas_item_responses` | participant_id, item, valor, respondido_em |
| vinhetas_ordem | `vignette_order` | participant_id, vignette_id, posicao |
| vinhetas_avaliacao | `vignette_responses` | participant_id, vignette_id + `q*` + tempos + completado_em |
| consentimento | `consent_records` | participant_id, decisao, tcle_versao, registrado_em |

RLS: todas essas tabelas já têm `select … or public.is_admin()`. Sem migration.

## Frontend

```
src/lib/exportacao.ts
  paraCsv(linhas: Record<string, unknown>[]): string     // serializer com escaping
  baixarArquivo(nome, conteudo, mime)
  carregarExport(studyId, { incluirPiloto }): Promise<ExportCompleto>   // busca tudo
  // + helpers por conjunto que derivam de ExportCompleto

src/routes/painel/telas.tsx  → Exportar (substitui o stub)
```

`Exportar`: `AlternadorModo`, um botão por conjunto + "Baixar tudo (JSON)".
Carrega uma vez ao entrar; os botões serializam do que já está em memória.
Conjuntos vazios mostram "sem dados".

## Testes

- `paraCsv`: cabeçalho a partir das chaves; vírgula/aspas/quebra-de-linha
  entre aspas; `null`→vazio; arrays→JSON; ordem de colunas estável.
- Filtro: `carregarExport` sem `incluirPiloto` não traz linhas de participante
  piloto nem descartado (via mock do conjunto de ids).
