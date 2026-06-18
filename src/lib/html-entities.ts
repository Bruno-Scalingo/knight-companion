const namedEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  bull: "•",
  ccedil: "ç",
  Ccedil: "Ç",
  eacute: "é",
  Eacute: "É",
  egrave: "è",
  Egrave: "È",
  ecirc: "ê",
  Ecirc: "Ê",
  euml: "ë",
  Euml: "Ë",
  agrave: "à",
  Agrave: "À",
  acirc: "â",
  Acirc: "Â",
  auml: "ä",
  Auml: "Ä",
  icirc: "î",
  Icirc: "Î",
  iuml: "ï",
  Iuml: "Ï",
  ocirc: "ô",
  Ocirc: "Ô",
  ugrave: "ù",
  Ugrave: "Ù",
  ougrave: "ù",
  Ougrave: "Ù",
  ucirc: "û",
  Ucirc: "Û",
  uuml: "ü",
  Uuml: "Ü",
  laquo: "«",
  ldquo: "“",
  lsquo: "‘",
  mdash: "—",
  ndash: "–",
  oelig: "œ",
  OElig: "Œ",
  raquo: "»",
  rdquo: "”",
  rsquo: "’",
  nbsp: " ",
  quot: "\"",
  hellip: "…"
};

export function decodeHtmlEntities(value: string) {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);?/g, (entity, code: string) => {
    if (code.startsWith("#x") || code.startsWith("#X")) {
      const parsed = Number.parseInt(code.slice(2), 16);
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 0x10ffff ? String.fromCodePoint(parsed) : entity;
    }

    if (code.startsWith("#")) {
      const parsed = Number.parseInt(code.slice(1), 10);
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 0x10ffff ? String.fromCodePoint(parsed) : entity;
    }

    return namedEntities[code] ?? entity;
  });
}
