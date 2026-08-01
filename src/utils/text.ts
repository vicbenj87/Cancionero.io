/** Quita tildes/diacríticos y pasa a minúsculas, para comparar sin acentos. */
export function foldAccents(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Normaliza para búsquedas: sin acentos, minúsculas, espacios colapsados. */
export function normalizeForSearch(text: string): string {
  return foldAccents(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Quita signos de apertura/puntuación inicial para que no alteren el orden. */
function stripLeadingPunctuation(text: string): string {
  return text.replace(/^[\s¡¿"'“”«»(.,\-–—*_]+/, "");
}

/** Clave de orden alfabético con criterio español (tildes no cuentan,
 * ñ se ordena junto a la n, números se comparan numéricamente:
 * "Salmo 2" antes que "Salmo 10"). */
const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });

export function compareTitles(a: string, b: string): number {
  return collator.compare(stripLeadingPunctuation(a), stripLeadingPunctuation(b));
}

/** Divide un texto de estrofa en líneas no vacías. */
export function splitLines(text: string): string[] {
  return (text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}
