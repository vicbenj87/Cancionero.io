/* =====================================================================
   cache.js — Guarda las respuestas de Google un rato para que la app
   abra al instante y siga funcionando si la red falla a mitad del
   servicio. Si el navegador bloquea el almacenamiento, cae a memoria.
   ===================================================================== */

const memoria = new Map();

function almacen() {
  try {
    const p = '__prueba__';
    localStorage.setItem(p, '1');
    localStorage.removeItem(p);
    return localStorage;
  } catch { return null; }
}
const disco = almacen();

export function leer(clave, minutos) {
  const crudo = disco ? disco.getItem(clave) : memoria.get(clave);
  if (!crudo) return null;
  try {
    const { t, v } = JSON.parse(crudo);
    if (Date.now() - t > minutos * 60000) return null;
    return v;
  } catch { return null; }
}

export function escribir(clave, valor) {
  const crudo = JSON.stringify({ t: Date.now(), v: valor });
  memoria.set(clave, crudo);
  try { if (disco) disco.setItem(clave, crudo); } catch { /* cuota llena */ }
}

/** Devuelve lo cacheado aunque esté vencido. Red de seguridad offline. */
export function leerVencido(clave) {
  const crudo = disco ? disco.getItem(clave) : memoria.get(clave);
  if (!crudo) return null;
  try { return JSON.parse(crudo).v; } catch { return null; }
}

export function limpiar() {
  memoria.clear();
  try { if (disco) Object.keys(disco).filter(k => k.startsWith('cnc:')).forEach(k => disco.removeItem(k)); } catch {}
}
