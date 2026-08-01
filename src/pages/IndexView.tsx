import { useMemo, useState } from "react";
import { ORDEN_ALFABETICO } from "@/config";
import { irALetra, irAProyeccion } from "@/hooks/useHashRoute";
import type { Song } from "@/types";
import { buscarCanciones } from "@/utils/search";
import { compareTitles } from "@/utils/text";

type Filtro = "todas" | "dominical" | "cena";

function pasaFiltro(song: Song, filtro: Filtro): boolean {
  if (filtro === "todas") return true;
  if (filtro === "dominical") return song.tipo === 1 || song.tipo === 3;
  if (filtro === "cena") return song.tipo === 2 || song.tipo === 3;
  return true;
}

export function IndexView({
  songs,
  loading,
  fromCache,
  lastUpdated,
  error,
  onRefresh,
}: {
  songs: Song[];
  loading: boolean;
  fromCache: boolean;
  lastUpdated: number | null;
  error: string | null;
  onRefresh: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const resultados = useMemo(() => {
    const filtradas = songs.filter((s) => pasaFiltro(s, filtro));
    const matches = buscarCanciones(filtradas, query);
    if (ORDEN_ALFABETICO) {
      return [...matches].sort((a, b) => compareTitles(a.song.titulo, b.song.titulo));
    }
    return matches;
  }, [songs, query, filtro]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg shadow-lg shadow-indigo-900/40">
                🎶
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-tight">Cancionero</h1>
                <p className="text-xs text-slate-400">
                  {songs.length} canciones · sincronizado con Google Sheets
                </p>
              </div>
            </div>
            <button
              onClick={onRefresh}
              title="Actualizar desde Google Sheets"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
              disabled={loading}
            >
              <span className={loading ? "inline-block animate-spin" : ""}>🔄</span>
            </button>
          </div>

          <label htmlFor="busqueda" className="sr-only">
            Buscar en títulos y letras
          </label>
          <input
            id="busqueda"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en títulos y letras…"
            className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none ring-indigo-400/60 focus:ring-2"
          />

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {(
              [
                ["todas", "Todas"],
                ["dominical", "Dominical"],
                ["cena", "Santa Cena"],
              ] as [Filtro, string][]
            ).map(([valor, etiqueta]) => (
              <button
                key={valor}
                onClick={() => setFiltro(valor)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filtro === valor
                    ? "bg-indigo-500 text-white"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              {fromCache
                ? "Mostrando una copia guardada: no se pudo actualizar desde Google Sheets ahora mismo."
                : error}
            </p>
          )}
          {lastUpdated && !error && (
            <p className="mt-2 text-[11px] text-slate-500">
              Última actualización: {new Date(lastUpdated).toLocaleString("es-ES")}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4">
        {resultados.length === 0 && (
          <p className="py-16 text-center text-sm text-slate-500">
            No se encontraron canciones para “{query}”.
          </p>
        )}

        <ul className="divide-y divide-white/5">
          {resultados.map(({ song, matchInTitle, matchSlideNumero, matchSnippet }) => (
            <li key={song.id} className="group flex items-center gap-3 py-3">
              <button
                onClick={() => irAProyeccion(song.id, 1)}
                className="flex-1 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/5"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] text-slate-500">#{song.id}</span>
                  <span className="font-medium text-slate-100">{song.titulo}</span>
                  {song.tipo === 2 && (
                    <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-300">
                      Santa Cena
                    </span>
                  )}
                  {song.tipo === 3 && (
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">
                      Ambas
                    </span>
                  )}
                </div>
                {!matchInTitle && matchSnippet && (
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    <span className="text-indigo-400">Diapositiva {matchSlideNumero}:</span>{" "}
                    {matchSnippet}
                  </p>
                )}
              </button>
              <button
                onClick={() => irALetra(song.id)}
                className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              >
                Letra
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
