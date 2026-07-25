/* =====================================================================
   csv.js — Lector de CSV que respeta comillas y saltos de línea
   Google Sheets exporta las celdas con varias líneas entre comillas,
   así que un simple split(',') rompería las diapositivas.
   ===================================================================== */

export function parsearCSV(texto) {
  const filas = [];
  let fila = [];
  let campo = '';
  let enComillas = false;

  // Normaliza saltos de línea de Windows
  texto = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];

    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; }  // comilla escapada
        else enComillas = false;
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"')      { enComillas = true; }
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n'){ fila.push(campo); filas.push(fila); fila = []; campo = ''; }
    else                { campo += c; }
  }

  // Último campo pendiente
  if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila); }

  // Elimina filas totalmente vacías
  return filas.filter(f => f.some(v => v.trim() !== ''));
}
