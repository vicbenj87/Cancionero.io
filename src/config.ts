/**
 * ============================================================================
 *  CONFIGURACIÓN DEL CANCIONERO
 * ============================================================================
 *  Este es el ÚNICO archivo que normalmente necesitas tocar para conectar
 *  la app a TU Google Sheet. Lee las instrucciones del README.md.
 * ============================================================================
 */

// ID de la hoja de cálculo de Google (va en la URL, entre /d/ y /edit)
// Ejemplo de URL:
// https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit#gid=0
export const SHEET_ID = "1C5H-nEBu_mTtCnFO8FpfBgI4ybwMH2pGWHx-s2F3eqQ";

// Nombre EXACTO de la pestaña (hoja) dentro del documento
export const SHEET_NAME = "Cancionero_Online";

// Cuántas diapositivas por canción soporta la app (columnas "Diapositiva 1..N")
export const NUM_SLIDE_COLUMNS = 22;

// Cada cuántos minutos se vuelve a consultar Google Sheets automáticamente
// mientras la app está abierta (además, siempre se consulta al cargar la página)
export const AUTO_REFRESH_MINUTES = 5;

// Mínimo de caracteres para que el buscador entre a mirar dentro de las letras
export const MIN_CHARS_LYRICS_SEARCH = 3;

// Si es true, el índice se muestra en orden alfabético (criterio español).
// Si es false, respeta el orden de las filas de la hoja.
export const ORDEN_ALFABETICO = true;

// Cuántos fondos distintos hay disponibles (se sortean y no se repiten
// mientras quepan en la memoria configurada abajo)
export const TOTAL_FONDOS = 35;
export const MEMORIA_SIN_REPETIR = 10;

// Milisegundos que parpadean las flechas de navegación al entrar a una canción
export const PARPADEO_INICIAL_MS = 2400;

// Milisegundos de inactividad antes de esconder los controles en proyección
export const OCULTAR_CONTROLES_TRAS_MS = 3500;

// Si es true, de la última diapositiva se vuelve a la primera y viceversa
export const BUCLE_DIAPOSITIVAS = true;

// Clave usada para guardar copia local (offline) de las canciones
export const CACHE_KEY = "cancionero_cache_v1";
