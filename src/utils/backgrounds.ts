import { MEMORIA_SIN_REPETIR, TOTAL_FONDOS } from "@/config";

/**
 * 35 combinaciones de color distintas para los fondos animados de proyección.
 * Son degradados CSS puros (no descargan nada, funcionan sin conexión).
 */
const PALETAS: [string, string, string][] = [
  ["#1e3a8a", "#7c3aed", "#0f172a"],
  ["#0f766e", "#134e4a", "#022c22"],
  ["#7c2d12", "#9a3412", "#1c1917"],
  ["#312e81", "#1e1b4b", "#020617"],
  ["#831843", "#500724", "#1a0510"],
  ["#064e3b", "#022c22", "#052e16"],
  ["#78350f", "#451a03", "#1c0a00"],
  ["#1e293b", "#0f172a", "#020617"],
  ["#4c1d95", "#2e1065", "#100422"],
  ["#0c4a6e", "#082f49", "#020617"],
  ["#7f1d1d", "#450a0a", "#1c0505"],
  ["#134e4a", "#042f2e", "#01110f"],
  ["#3730a3", "#312e81", "#0b0a2a"],
  ["#701a75", "#4a044e", "#170318"],
  ["#164e63", "#083344", "#031621"],
  ["#166534", "#052e16", "#01140a"],
  ["#9d174d", "#831843", "#22071a"],
  ["#1d4ed8", "#1e1b4b", "#05061a"],
  ["#92400e", "#7c2d12", "#1c0f05"],
  ["#0e7490", "#155e75", "#042028"],
  ["#5b21b6", "#3b0764", "#100322"],
  ["#065f46", "#064e3b", "#00160f"],
  ["#991b1b", "#7f1d1d", "#1c0404"],
  ["#3f3f46", "#18181b", "#000000"],
  ["#0369a1", "#0c4a6e", "#021627"],
  ["#6d28d9", "#4c1d95", "#0d0221"],
  ["#b45309", "#78350f", "#170e02"],
  ["#115e59", "#134e4a", "#031311"],
  ["#9f1239", "#881337", "#1a0410"],
  ["#1d4ed8", "#0e7490", "#031421"],
  ["#4338ca", "#312e81", "#08071f"],
  ["#15803d", "#166534", "#02170b"],
  ["#a21caf", "#701a75", "#1a0420"],
  ["#0f172a", "#1e293b", "#334155"],
  ["#b91c1c", "#92400e", "#1c0d02"],
];

export interface Fondo {
  indice: number;
  gradient: string;
  duracionS: number;
}

export function obtenerFondo(indice: number): Fondo {
  const idx = ((indice % TOTAL_FONDOS) + TOTAL_FONDOS) % TOTAL_FONDOS;
  const [c1, c2, c3] = PALETAS[idx % PALETAS.length];
  const angulo = 120 + ((idx * 37) % 240);
  const duracionS = 18 + (idx % 7) * 4;
  return {
    indice: idx,
    gradient: `linear-gradient(${angulo}deg, ${c1}, ${c2} 55%, ${c3})`,
    duracionS,
  };
}

const HISTORIAL_KEY = "cancionero_fondos_historial";

function leerHistorial(): number[] {
  try {
    const raw = sessionStorage.getItem(HISTORIAL_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function guardarHistorial(hist: number[]) {
  try {
    sessionStorage.setItem(HISTORIAL_KEY, JSON.stringify(hist));
  } catch {
    /* noop */
  }
}

/** Elige un fondo al azar evitando repetir los últimos usados en esta sesión. */
export function sortearFondo(): Fondo {
  const historial = leerHistorial();
  const disponibles = Array.from({ length: TOTAL_FONDOS }, (_, i) => i).filter(
    (i) => !historial.includes(i)
  );
  const pool = disponibles.length > 0 ? disponibles : Array.from({ length: TOTAL_FONDOS }, (_, i) => i);
  const elegido = pool[Math.floor(Math.random() * pool.length)];

  const nuevoHistorial = [elegido, ...historial].slice(0, MEMORIA_SIN_REPETIR);
  guardarHistorial(nuevoHistorial);

  return obtenerFondo(elegido);
}

/** Fondo determinístico según el id de la canción (estable al recargar). */
export function fondoParaCancion(songId: number, seedExtra = 0): Fondo {
  return obtenerFondo(songId * 7 + seedExtra);
}
