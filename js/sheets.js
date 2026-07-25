/* =====================================================================
   sheets.js — Trae las canciones y la lista de fondos desde la hoja
   ===================================================================== */

import { CONFIG } from './config.js';
import { parsearCSV } from './csv.js';
import * as cache from './cache.js';

function urlCSV(pestana) {
  return `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}` +
         `/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(pestana)}` +
         `&_=${Math.floor(Date.now() / 60000)}`;   // rompe caché del navegador cada minuto
}

async function traerPestana(pestana) {
  const r = await fetch(urlCSV(pestana));
  if (!r.ok) throw new Error(`La pestaña "${pestana}" no respondió (${r.status}).`);
  const texto = await r.text();
  if (texto.trim().startsWith('<')) {
    throw new Error('La hoja no es pública. Compártela como "Cualquier persona con el enlace: Lector".');
  }
  return parsearCSV(texto);
}

/* --- Utilidades ------------------------------------------------------ */

/** Convierte un título en un identificador estable para la URL.
    "A Tus pies" -> "a-tus-pies". Sobrevive a reordenar la hoja. */
export function aClave(titulo) {
  return normalizar(titulo)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

export function normalizar(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').trim();
}

/* --- Canciones ------------------------------------------------------- */
/* Formato esperado:
   A1: Título | B1: Diapositiva 1 | C1: Diapositiva 2 | ...
   Cada fila = una canción. Dentro de una celda, Alt+Enter separa versos. */

export async function cargarCanciones() {
  const CLAVE = 'cnc:canciones';
  const guardado = cache.leer(CLAVE, CONFIG.CACHE_MINUTOS);
  if (guardado) return guardado;

  let filas;
  try {
    filas = await traerPestana(CONFIG.PESTANA_CANCIONES);
  } catch (e) {
    const respaldo = cache.leerVencido(CLAVE);
    if (respaldo) return respaldo;
    throw e;
  }

  filas.shift();  // quita la fila de encabezados

  const canciones = filas.map((f, i) => {
    const titulo = (f[0] || '').trim();
    const diapositivas = f.slice(1)
      .map(c => (c || '').trim())
      .filter(c => c !== '');
    return {
      n: i + 1,
      clave: aClave(titulo),
      titulo,
      busqueda: normalizar(titulo),
      diapositivas,
    };
  }).filter(c => c.titulo && c.diapositivas.length);

  if (canciones.length > CONFIG.MAX_CANCIONES) {
    console.warn(`Hay ${canciones.length} canciones; el diseño está probado hasta ${CONFIG.MAX_CANCIONES}.`);
  }

  cache.escribir(CLAVE, canciones);
  return canciones;
}

/* --- Fondos declarados en la hoja ------------------------------------ */
/* Formato esperado:
   A1: Nombre | B1: ID de Drive | C1: Tipo (imagen / video) */

export async function cargarFondosDeHoja() {
  const CLAVE = 'cnc:fondos';
  const guardado = cache.leer(CLAVE, CONFIG.CACHE_MINUTOS);
  if (guardado) return guardado;

  let filas;
  try { filas = await traerPestana(CONFIG.PESTANA_FONDOS); }
  catch { return cache.leerVencido(CLAVE) || []; }

  filas.shift();

  const fondos = filas.map(f => {
    const id = extraerId((f[1] || '').trim());
    const tipo = normalizar(f[2]).startsWith('v') ? 'video' : 'imagen';
    return { nombre: (f[0] || '').trim(), id, tipo };
  }).filter(f => f.id);

  cache.escribir(CLAVE, fondos);
  return fondos;
}

/** Acepta el ID pelado o cualquier URL de Drive pegada tal cual. */
export function extraerId(valor) {
  if (!valor) return '';
  const m = valor.match(/[-\w]{25,}/);
  return m ? m[0] : '';
}
