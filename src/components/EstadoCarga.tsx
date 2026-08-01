export function PantallaCargando() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-200">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-400" />
      <p className="text-sm tracking-wide text-slate-400">Cargando cancionero desde Google Sheets…</p>
    </div>
  );
}

export function PantallaError({
  mensaje,
  onReintentar,
}: {
  mensaje: string;
  onReintentar: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-slate-200">
      <div className="text-4xl">⚠️</div>
      <h1 className="text-xl font-semibold">No se pudo cargar el cancionero</h1>
      <p className="max-w-md text-sm text-slate-400">{mensaje}</p>
      <button
        onClick={onReintentar}
        className="mt-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
      >
        Reintentar
      </button>
    </div>
  );
}
