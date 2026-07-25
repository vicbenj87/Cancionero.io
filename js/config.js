/* =====================================================================
   config.js — Único archivo que necesitas editar para poner en marcha
   ===================================================================== */

export const CONFIG = {

  /* ---- 1. GOOGLE SHEETS ------------------------------------------ */
  // ID del documento. Está en la URL:
  // docs.google.com/spreadsheets/d/  ESTE_ES_EL_ID  /edit
  SHEET_ID: '1C5H-nEBu_mTtCnFO8FpfBgI4ybwMH2pGWHx-s2F3eqQ',

  // Nombres exactos de las pestañas dentro de la hoja
  PESTANA_CANCIONES: 'Canciones',
  PESTANA_FONDOS:    'Fondos',

  /* ---- 2. GOOGLE DRIVE (fondos) ---------------------------------- */
  // Opción A (recomendada, sin clave): deja esto vacío y llena la
  // pestaña "Fondos" de la hoja con los IDs de cada archivo.
  // Opción B (automática): pega el ID de la carpeta + una API Key de
  // Google Cloud con la Drive API activada. La carpeta debe estar
  // compartida como "Cualquier persona con el enlace: Lector".
  DRIVE_CARPETA_ID: '1URTJ4DSmrbVbqqQSJbSgElMGuhL3TRFf',
  DRIVE_API_KEY:    '',

  /* ---- 3. COMPORTAMIENTO ----------------------------------------- */
  // false = un fondo aleatorio por canción (recomendado, más sobrio)
  // true  = un fondo aleatorio distinto en cada diapositiva
  FONDO_POR_DIAPOSITIVA: false,

  // Oscurecimiento sobre el fondo para que la letra siempre se lea.
  // 0 = sin velo, 1 = negro total. 0.45–0.6 funciona bien en pantalla.
  VELO: 0.5,

  // Ancho al que se piden las imágenes a Drive (px). 1920 = Full HD.
  ANCHO_IMAGEN: 1920,

  // Minutos que se guarda la letra en caché antes de volver a pedirla.
  // Sube el número si tu conexión en el templo es lenta.
  CACHE_MINUTOS: 30,

  // Máximos previstos (solo para avisos en consola, no limita nada)
  MAX_CANCIONES: 250,
  MAX_FONDOS: 35,
};
