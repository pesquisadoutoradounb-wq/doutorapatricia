#!/usr/bin/env python3
"""
Gera supabase/seed.local.sql (gitignore) a partir de docs/fonte-metodologia/
(também gitignore). Nenhum texto de instrumento fica neste script.

Também gera docs/fonte-metodologia/_transcricao-para-conferencia.md para a
pesquisadora conferir YSQ-S3 e PANAS contra o instrumento oficial.

Uso:  python scripts/gerar-seed-local.py
Requer:  pip install pymupdf   (só para extrair os PDFs)

Carregue o resultado no banco local com:
  psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" -f supabase/seed.local.sql
"""
from __future__ import annotations
import html
import re
import sys
import zipfile
from pathlib import Path

FONTE = Path("docs/fonte-metodologia")
SAIDA_SEED = Path("supabase/seed.local.sql")


def sql(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def docx_paras(caminho: Path) -> list[str]:
    xml = zipfile.ZipFile(caminho).read("word/document.xml").decode("utf-8")
    xml = xml.replace("</w:p>", "\n")
    xml = re.sub(r"<[^>]+>", "", xml)
    return [p.strip() for p in html.unescape(xml).split("\n")]


def html_de_paras(paras: list[str], pular: int = 1) -> str:
    corpo = [p for p in paras if p][pular:]
    return "".join(f"<p>{html.escape(p)}</p>" for p in corpo)


def ysq_itens() -> dict[int, str]:
    import fitz  # pymupdf

    doc = fitz.open(str(FONTE / "ysq s3.pdf"))
    itens: dict[int, str] = {}
    for pagina in doc:
        linhas = []
        for bloco in pagina.get_text("dict")["blocks"]:
            for linha in bloco.get("lines", []):
                txt = "".join(s["text"] for s in linha["spans"]).strip()
                if not txt or txt in ("YSQ – S3", "Questão", "#"):
                    continue
                if txt.startswith("Gerado em") or re.match(r"^[•·]?\s*\d{2}/\d{2}/\d{4}", txt):
                    continue
                linhas.append((round(linha["bbox"][1], 1), round(linha["bbox"][0], 1), txt))
        linhas.sort()
        marcas = sorted(
            (y, int(t)) for (y, x, t) in linhas if 50 <= x <= 67 and re.fullmatch(r"\d{1,2}", t)
        )
        for i, (my, mt) in enumerate(marcas):
            lo = (marcas[i - 1][0] + my) / 2 if i > 0 else my - 30
            hi = (marcas[i + 1][0] + my) / 2 if i + 1 < len(marcas) else my + 60
            q = [t for (y, x, t) in linhas if 70 <= x <= 210 and lo <= y < hi]
            itens[mt] = re.sub(r"\s+", " ", " ".join(q)).strip()
    return itens


PANAS_ITENS = [
    "Ativo", "Alerta", "Atento", "Determinado", "Entusiasmado", "Empolgado",
    "Inspirado", "Interessado", "Forte", "Com medo", "Envergonhado", "Aflito",
    "Culpado", "Hostil", "Irritável", "Inquieto", "Nervoso", "Apavorado", "Chateado",
]
YSQ_ESCALA = [
    "Completamente falso sobre mim", "Em grande parte falso sobre mim",
    "Um pouco mais verdadeiro do que falso sobre mim", "Moderadamente verdadeiro sobre mim",
    "Em grande parte verdadeiro sobre mim", "Me descreve perfeitamente",
]
PANAS_ESCALA = ["Muito pouco ou nada", "Um pouco", "Moderadamente", "Bastante", "Extremamente"]


def main() -> int:
    if not FONTE.exists():
        print(f"ERRO: {FONTE} não existe (é gitignore; precisa dos arquivos-fonte locais).")
        return 1

    vinhetas: list[str] = []
    titulos: dict[int, str] = {}
    for p in docx_paras(FONTE / "vinhetas estudo 1.docx"):
        m = re.match(r"^Vinheta (\d+) — (.+)$", p)
        if m:
            titulos[int(m.group(1))] = m.group(2).strip()
        m = re.match(r"^Imagine a seguinte situação:\s*(.+)$", p)
        if m:
            vinhetas.append(m.group(1).strip())
    assert len(vinhetas) == 10 and len(titulos) == 10, "extração de vinhetas falhou"

    docs = [
        ("tcle", "rascunho-fonte-2026-08", "Termo de Consentimento Livre e Esclarecido — TCLE",
         html_de_paras(docx_paras(FONTE / "TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO estudo 1.docx"))),
        ("instrucoes_gerais", "fonte-2026-08", "Instruções para a tarefa de imaginação",
         html_de_paras(docx_paras(FONTE / "Instruções gerais ao participante.docx"))),
        ("encerramento", "fonte-2026-08", "Obrigado(a) por sua participação",
         html_de_paras(docx_paras(FONTE / "encerramento do procedimento experimental.docx"))),
    ]

    itens_ysq = ysq_itens()
    assert len(itens_ysq) == 90, f"YSQ: {len(itens_ysq)} itens extraídos"

    E1 = "(select id from public.studies where slug = 'estudo-1')"
    out: list[str] = [
        "-- GERADO por scripts/gerar-seed-local.py — NÃO versionar.",
        "-- Conteúdo pré-CEP. Conferir PERGUNTAR 1,2,9,11,12,13,14,16,17,21,22 antes da coleta.",
        "-- Requer as migrations 0001-0010 aplicadas.\n",
        "-- ===== documentos do Estudo 1 =====",
    ]
    for slug, ver, tit, corpo in docs:
        out.append("insert into public.study_documents (study_id, slug, versao, titulo, corpo_html, ativo) values")
        out.append(f"  ({E1}, {sql(slug)}, {sql(ver)}, {sql(tit)}, {sql(corpo)}, true)")
        out.append("on conflict (study_id, slug, versao) do update set "
                   "corpo_html = excluded.corpo_html, titulo = excluded.titulo, ativo = true;\n")
    out.append("-- informacoes_gerais e desconforto: PERGUNTAR 21 e 22 — sem texto-fonte; cadastrar no painel.\n")

    out.append("-- ===== vinhetas (texto-estímulo exato; sem título/domínio ao participante) =====")
    for i in range(10):
        vid = i + 1
        dom = 1 if vid <= 5 else 2
        out.append("insert into public.vignettes (study_id, id, dominio, titulo_interno, conteudo_predominante, texto_estimulo) values")
        out.append(f"  ({E1}, {vid}, {dom}, {sql(titulos[vid])}, null, {sql(vinhetas[i])})")
        out.append("on conflict (id) do update set "
                   "texto_estimulo = excluded.texto_estimulo, titulo_interno = excluded.titulo_interno, "
                   "dominio = excluded.dominio;\n")

    out.append("-- ===== itens do YSQ-S3 (1-90) =====")
    for n in range(1, 91):
        out.append(f"insert into public.ysq_items (item, enunciado) values ({n}, {sql(itens_ysq[n])}) "
                   "on conflict (item) do update set enunciado = excluded.enunciado;")

    out.append("\n-- ===== itens do PANAS (1-19) =====")
    for i, t in enumerate(PANAS_ITENS, 1):
        out.append(f"insert into public.panas_items (item, termo) values ({i}, {sql(t)}) "
                   "on conflict (item) do update set termo = excluded.termo;")

    out.append("\n-- ===== rótulos de escala (fonte: PDFs) =====")
    for i, t in enumerate(YSQ_ESCALA, 1):
        out.append(f"insert into public.instrument_scale_points (instrumento, valor, rotulo) values "
                   f"('ysq', {i}, {sql(t)}) on conflict (instrumento, valor) do update set rotulo = excluded.rotulo;")
    for i, t in enumerate(PANAS_ESCALA, 1):
        out.append(f"insert into public.instrument_scale_points (instrumento, valor, rotulo) values "
                   f"('panas', {i}, {sql(t)}) on conflict (instrumento, valor) do update set rotulo = excluded.rotulo;")

    out.append("\n-- ===== convite PILOTO para avaliar o fluxo do participante =====")
    out.append("-- Link: https://pesquisadoutoradounb-wq.github.io/doutorapatricia/#/participar/00000000-0000-4000-8000-000000000001")
    out.append("insert into public.invites (study_id, email, nome, modo, status, token) values")
    out.append(f"  ({E1}, 'piloto.avaliacao@teste.local', 'Avaliação do fluxo', 'piloto', 'enviado',")
    out.append("   '00000000-0000-4000-8000-000000000001')")
    out.append("on conflict (token) do nothing;\n")

    SAIDA_SEED.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"escrito {SAIDA_SEED}")

    conf = ["# Transcrição para conferência — NÃO versionar", "",
            "Extraído automaticamente dos PDFs. **Confira contra o instrumento oficial.**", "",
            "## YSQ-S3 — escala 1–6",
            " · ".join(f"{i} {r}" for i, r in enumerate(YSQ_ESCALA, 1)), ""]
    conf += [f"{n}. {itens_ysq[n]}" for n in range(1, 91)]
    conf += ["", "## PANAS — escala 1–5",
             " · ".join(f"{i} {r}" for i, r in enumerate(PANAS_ESCALA, 1)),
             "", 'Instrução-fonte diz "período indicado pelo terapeuta" — incorreto aqui (PERGUNTAR 11).', ""]
    conf += [f"{i}. {t}" for i, t in enumerate(PANAS_ITENS, 1)]
    (FONTE / "_transcricao-para-conferencia.md").write_text("\n".join(conf), encoding="utf-8")
    print(f"escrito {FONTE / '_transcricao-para-conferencia.md'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
