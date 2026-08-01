import { MIN_CHARS_LYRICS_SEARCH } from "@/config";
import type { SearchMatch, Song } from "@/types";
import { normalizeForSearch, splitLines } from "@/utils/text";

/** Recorta una línea larga dejando visible el fragmento donde cayó la búsqueda. */
function recortarLinea(linea: string, query: string, maxLen = 90): string {
  const idx = normalizeForSearch(linea).indexOf(query);
  if (linea.length <= maxLen || idx < 0) return linea;
  const inicio = Math.max(0, idx - 30);
  const prefijo = inicio > 0 ? "…" : "";
  const recorte = linea.slice(inicio, inicio + maxLen);
  const sufijo = inicio + maxLen < linea.length ? "…" : "";
  return `${prefijo}${recorte}${sufijo}`;
}

export function buscarCanciones(songs: Song[], queryRaw: string): SearchMatch[] {
  const query = normalizeForSearch(queryRaw);

  if (!query) {
    return songs.map((song) => ({ song, matchInTitle: true }));
  }

  const resultados: SearchMatch[] = [];

  for (const song of songs) {
    const matchInTitle = song.tituloBusqueda.includes(query);

    if (matchInTitle) {
      resultados.push({ song, matchInTitle: true });
      continue;
    }

    if (query.length < MIN_CHARS_LYRICS_SEARCH) continue;

    // buscar dentro de las estrofas
    let encontrado = false;
    for (const slide of song.slides) {
      const lineas = splitLines(slide.texto);
      for (const linea of lineas) {
        if (normalizeForSearch(linea).includes(query)) {
          resultados.push({
            song,
            matchInTitle: false,
            matchSlideNumero: slide.numero,
            matchSnippet: recortarLinea(linea, query),
          });
          encontrado = true;
          break;
        }
      }
      if (encontrado) break;
    }
  }

  return resultados;
}
