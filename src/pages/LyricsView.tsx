import { irAIndice, irAProyeccion } from "@/hooks/useHashRoute";
import type { Song } from "@/types";

export function LyricsView({ song }: { song: Song }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/90 px-4 py-4 backdrop-blur">
        <button
          onClick={() => window.history.length > 1 ? window.history.back() : irAIndice()}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
        >
          ← Volver
        </button>
        <h1 className="flex-1 truncate text-center text-sm font-semibold sm:text-base">{song.titulo}</h1>
        <button
          onClick={() => irAProyeccion(song.id, 1)}
          className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-400"
        >
          Proyectar
        </button>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-5 py-10">
        {song.slides.length === 0 && (
          <p className="text-center text-slate-500">Esta canción todavía no tiene letra cargada.</p>
        )}
        {song.slides.map((slide) => (
          <section key={slide.numero} className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-indigo-400">
              Diapositiva {slide.numero}
            </span>
            <div className="text-lg leading-relaxed text-slate-100">
              {slide.texto.split("\n").map((linea, i) => (
                <p key={i}>{linea}</p>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
