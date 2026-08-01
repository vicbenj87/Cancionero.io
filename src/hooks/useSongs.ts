import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUTO_REFRESH_MINUTES,
  CACHE_KEY,
  NUM_SLIDE_COLUMNS,
  SHEET_ID,
  SHEET_NAME,
} from "@/config";
import type { FetchState, Song, TipoCulto } from "@/types";
import { parseCSV } from "@/utils/csv";
import { foldAccents, normalizeForSearch } from "@/utils/text";

function buildSheetUrl(): string {
  const base = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`;
  const params = new URLSearchParams({
    tqx: "out:csv",
    sheet: SHEET_NAME,
    // evita respuestas cacheadas por el navegador/CDN
    cachebust: String(Date.now()),
  });
  return `${base}?${params.toString()}`;
}

function normalizeHeader(h: string): string {
  return foldAccents((h || "").trim()).replace(/\s+/g, " ");
}

interface ColumnMap {
  titulo: number;
  tipo: number;
  slides: number[]; // índice de columna por cada diapositiva 1..N
}

function detectarColumnas(headerRow: string[]): ColumnMap {
  const normalizados = headerRow.map(normalizeHeader);

  let titulo = normalizados.findIndex((h) => h === "titulo" || h === "título" || h.includes("titulo"));
  let tipo = normalizados.findIndex((h) => h === "tipo");

  const slides: number[] = [];
  for (let n = 1; n <= NUM_SLIDE_COLUMNS; n++) {
    const idx = normalizados.findIndex((h) => h === `diapositiva ${n}` || h === `diapositiva0${n}`);
    slides.push(idx);
  }

  const slidesOk = slides.every((i) => i >= 0);

  // Red de seguridad: si no se detectaron los encabezados por nombre,
  // se usa la posición fija A=Título, B..W=Diapositivas 1..22, X=TIPO
  if (titulo < 0) titulo = 0;
  if (tipo < 0) tipo = 1 + NUM_SLIDE_COLUMNS;
  if (!slidesOk) {
    for (let n = 1; n <= NUM_SLIDE_COLUMNS; n++) slides[n - 1] = n;
  }

  return { titulo, tipo, slides };
}

function parseTipo(valor: string): TipoCulto {
  const v = (valor || "").trim();
  if (v === "1") return 1;
  if (v === "2") return 2;
  if (v === "3") return 3;
  return 0;
}

function filasACanciones(rows: string[][]): Song[] {
  if (rows.length < 2) return [];
  const columnas = detectarColumnas(rows[0]);
  const songs: Song[] = [];

  let id = 0;
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const titulo = (row[columnas.titulo] || "").trim();
    if (!titulo) continue;

    id++;
    const slides = columnas.slides
      .map((colIdx, i) => ({ numero: i + 1, texto: (row[colIdx] || "").trim() }))
      .filter((s) => s.texto.length > 0);

    const tipo = parseTipo(row[columnas.tipo] || "");
    const letraCompleta = slides.map((s) => s.texto).join("\n");

    songs.push({
      id,
      titulo,
      slides,
      tipo,
      tituloBusqueda: normalizeForSearch(titulo),
      letraBusqueda: normalizeForSearch(letraCompleta),
    });
  }

  return songs;
}

interface CachePayload {
  songs: Song[];
  timestamp: number;
}

function leerCache(): CachePayload | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachePayload) : null;
  } catch {
    return null;
  }
}

function guardarCache(songs: Song[], timestamp: number) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ songs, timestamp }));
  } catch {
    /* noop, por ejemplo cuota excedida */
  }
}

export function useSongs(): FetchState {
  const cacheInicial = useRef(leerCache());
  const [songs, setSongs] = useState<Song[]>(cacheInicial.current?.songs ?? []);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(
    cacheInicial.current?.timestamp ?? null
  );
  const [fromCache, setFromCache] = useState<boolean>(!!cacheInicial.current);
  const [tick, setTick] = useState(0);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildSheetUrl(), { cache: "no-store" });
      if (!res.ok) {
        throw new Error(
          `Google Sheets respondió con error ${res.status}. Revisa que la hoja esté ` +
            `compartida como "Cualquier usuario con el enlace puede ver".`
        );
      }
      const text = await res.text();
      if (/^\s*<!DOCTYPE html/i.test(text) || text.includes("accounts.google.com")) {
        throw new Error(
          "La hoja de cálculo no es pública todavía. Compártela como " +
            '"Cualquier usuario con el enlace" (rol: Lector).'
        );
      }
      const rows = parseCSV(text);
      const parsedSongs = filasACanciones(rows);
      if (parsedSongs.length === 0) {
        throw new Error(
          "Se conectó con la hoja pero no se encontraron canciones. Revisa el nombre " +
            'de la pestaña ("Cancionero_Online") y los encabezados de columnas.'
        );
      }
      const now = Date.now();
      setSongs(parsedSongs);
      setLastUpdated(now);
      setFromCache(false);
      guardarCache(parsedSongs, now);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido al cargar el cancionero.";
      setError(msg);
      const cache = leerCache();
      if (cache && cache.songs.length > 0) {
        setSongs(cache.songs);
        setLastUpdated(cache.timestamp);
        setFromCache(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar, tick]);

  useEffect(() => {
    if (AUTO_REFRESH_MINUTES <= 0) return;
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
    }, AUTO_REFRESH_MINUTES * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onFocus = () => setTick((t) => t + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { songs, loading, error, lastUpdated, fromCache, refresh };
}
