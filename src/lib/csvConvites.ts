/**
 * Parser tolerante da lista de convites colada / importada no painel.
 * Aceita: um e-mail por linha; `email,nome`; `email;nome` (Excel BR);
 * cabeçalho opcional; nome entre aspas com vírgula.
 */
export interface LinhaConvite {
  email: string;
  nome: string | null;
}

export interface ResultadoCsv {
  linhas: LinhaConvite[];
  erros: { linha: number; motivo: string }[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function separaCampos(linha: string, delim: string): string[] {
  const out: string[] = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (ch === '"') {
      aspas = !aspas;
    } else if (ch === delim && !aspas) {
      out.push(atual);
      atual = "";
    } else {
      atual += ch;
    }
  }
  out.push(atual);
  return out.map((c) => c.trim().replace(/^"|"$/g, "").trim());
}

export function parseCsvConvites(texto: string): ResultadoCsv {
  const linhas: LinhaConvite[] = [];
  const erros: { linha: number; motivo: string }[] = [];
  const vistos = new Set<string>();

  const brutas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (brutas.length === 0) return { linhas, erros };

  const delim = brutas[0].includes(";") && !brutas[0].includes(",") ? ";" : ",";

  brutas.forEach((bruta, i) => {
    const campos = separaCampos(bruta, delim);
    const email = (campos[0] ?? "").toLowerCase();
    const nome = campos.slice(1).join(" ").trim() || null;

    // cabeçalho: primeira linha sem e-mail válido em nenhum campo
    if (i === 0 && !campos.some((c) => EMAIL_RE.test(c.toLowerCase()))) return;

    if (!EMAIL_RE.test(email)) {
      erros.push({ linha: i + 1, motivo: `e-mail inválido: “${campos[0] ?? ""}”` });
      return;
    }
    if (vistos.has(email)) {
      erros.push({ linha: i + 1, motivo: `e-mail repetido: ${email}` });
      return;
    }
    vistos.add(email);
    linhas.push({ email, nome });
  });

  return { linhas, erros };
}
