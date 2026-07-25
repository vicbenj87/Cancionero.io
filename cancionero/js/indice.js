/* =====================================================================
   indice.js — Lista de canciones, búsqueda y salto por número
   ===================================================================== */

import { cargarCanciones, normalizar } from './sheets.js';
import { obtenerFondos } from './fondos.js';
import * as cache from './cache.js';

const $ = s => document.querySelector(s);

const el = {
  lista:   $('#lista'),
  buscar:  $('#buscar'),
  estado:  $('#estado'),
  total:   $('#total'),
  fondos:  $('#total-fondos'),
  vaciar:  $('#vaciar'),
  refrescar: $('#refrescar'),
};

let canciones = [];

export async function iniciar() {
  try {
    canciones = await cargarCanciones();
  } catch (e) {
    el.estado.textContent = e.message;
    el.estado.classList.add('estado--error');
    return;
  }

  el.estado.hidden = true;
  el.total.textContent = canciones.length;
  pintar(canciones);

  obtenerFondos()
    .then(f => el.fondos.textContent = f.length)
    .catch(() => el.fondos.textContent = '0');

  conectar();
}

function pintar(lista) {
  if (!lista.length) {
    el.lista.innerHTML = `<li class="vacio">Ninguna canción coincide. Prueba con otra palabra de la letra o del título.</li>`;
    return;
  }

  el.lista.innerHTML = lista.map(c => `
    <li>
      <a class="cancion" href="proyector.html#${c.n}">
        <span class="cancion__n">${String(c.n).padStart(3, '0')}</span>
        <span class="cancion__titulo">${c.titulo}</span>
        <span class="cancion__guia" aria-hidden="true"></span>
        <span class="cancion__diapos">${c.diapositivas.length}</span>
      </a>
    </li>`).join('');
}

function filtrar(texto) {
  const q = normalizar(texto);
  if (!q) return canciones;

  // Si escribes solo números, busca por número de canción
  if (/^\d+$/.test(q)) {
    const n = parseInt(q, 10);
    const exacta = canciones.filter(c => String(c.n).startsWith(q));
    if (exacta.length) return exacta;
    return canciones.filter(c => c.n === n);
  }

  const palabras = q.split(' ');
  return canciones.filter(c => {
    const cuerpo = c.busqueda + ' ' + normalizar(c.diapositivas.join(' '));
    return palabras.every(p => cuerpo.includes(p));
  });
}

function conectar() {
  let reloj;
  el.buscar.addEventListener('input', () => {
    clearTimeout(reloj);
    reloj = setTimeout(() => pintar(filtrar(el.buscar.value)), 90);
  });

  // Enter abre la primera coincidencia
  el.buscar.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const primera = el.lista.querySelector('a.cancion');
      if (primera) primera.click();
    }
    if (e.key === 'Escape') { el.buscar.value = ''; pintar(canciones); }
  });

  el.vaciar.addEventListener('click', () => {
    el.buscar.value = '';
    pintar(canciones);
    el.buscar.focus();
  });

  el.refrescar.addEventListener('click', () => {
    cache.limpiar();
    location.reload();
  });

  // "/" enfoca el buscador desde cualquier parte
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== el.buscar) {
      e.preventDefault(); el.buscar.focus();
    }
  });

  el.buscar.focus();
}
