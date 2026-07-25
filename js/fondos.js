/* =====================================================================
   fondos.js — Resuelve las URLs de Drive y reparte fondos al azar
   ===================================================================== */

import { CONFIG } from './config.js';
import { cargarFondosDeHoja } from './sheets.js';
import * as cache from './cache.js';

/* --- URLs de Drive ---------------------------------------------------- */

export function urlImagen(id, ancho = CONFIG.ANCHO_IMAGEN) {
  return `https://lh3.googleusercontent.com/d/${id}=w${ancho}`;
}

/** Alterna si la primera URL falla (algunas cuentas sirven mejor esta). */
export function urlImagenAlterna(id, ancho = CONFIG.ANCHO_IMAGEN) {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${ancho}`;
}

export function urlVideo(id) {
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

/* --- Listado automático de la carpeta (opcional) ---------------------- */

async function listarCarpetaDrive() {
  const CLAVE = 'cnc:drive';
  const guardado = cache.leer(CLAVE, CONFIG.CACHE_MINUTOS);
  if (guardado) return guardado;

  const url = 'https://www.googleapis.com/drive/v3/files' +
    `?q='${CONFIG.DRIVE_CARPETA_ID}'+in+parents+and+trashed=false` +
    '&fields=files(id,name,mimeType)&pageSize=100' +
    `&key=${CONFIG.DRIVE_API_KEY}`;

  const r = await fetch(url);
  if (!r.ok) throw new Error('No se pudo leer la carpeta de Drive.');
  const { files = [] } = await r.json();

  const fondos = files
    .filter(f => f.mimeType.startsWith('image/') || f.mimeType.startsWith('video/'))
    .map(f => ({
      nombre: f.name,
      id: f.id,
      tipo: f.mimeType.startsWith('video/') ? 'video' : 'imagen',
    }));

  cache.escribir(CLAVE, fondos);
  return fondos;
}

/* --- Punto de entrada -------------------------------------------------- */

export async function obtenerFondos() {
  if (CONFIG.DRIVE_CARPETA_ID && CONFIG.DRIVE_API_KEY) {
    try { return await listarCarpetaDrive(); }
    catch (e) { console.warn('Drive falló, uso la pestaña Fondos:', e.message); }
  }
  return cargarFondosDeHoja();
}

/* --- Azar sin repeticiones seguidas ------------------------------------ */
/* Baraja tipo "bolsa": saca todos los fondos en orden aleatorio antes de
   repetir alguno. Se ve más variado que un Math.random() puro.          */

function mezclar(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function crearBaraja(lista) {
  let bolsa = [];
  return function siguiente() {
    if (!lista.length) return null;
    if (!bolsa.length) bolsa = mezclar([...lista]);
    return bolsa.pop();
  };
}

/* --- Precarga ---------------------------------------------------------- */

export function precargar(fondo) {
  if (!fondo || fondo.tipo !== 'imagen') return;
  const img = new Image();
  img.src = urlImagen(fondo.id);
}
