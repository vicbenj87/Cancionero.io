/* =====================================================================
   proyector.js — Motor de proyección a pantalla completa
   ===================================================================== */

import { CONFIG } from './config.js';
import { cargarCanciones } from './sheets.js';
import { obtenerFondos, crearBaraja, precargar,
         urlImagen, urlImagenAlterna, urlVideo } from './fondos.js';

const $ = s => document.querySelector(s);

const el = {
  escenario:  $('#escenario'),
  fondoA:     $('#fondo-a'),
  fondoB:     $('#fondo-b'),
  letra:      $('#letra'),
  titulo:     $('#rotulo-titulo'),
  contador:   $('#rotulo-contador'),
  progreso:   $('#progreso'),
  anterior:   $('#anterior'),
  siguiente:  $('#siguiente'),
  aviso:      $('#aviso'),
};

let cancion = null;
let indice = 0;
let sacarFondo = () => null;
let capaActiva = 'a';
let listaFondos = [];
let enNegro = false;

/* --- Arranque ---------------------------------------------------------- */

export async function iniciar() {
  const n = parseInt(location.hash.slice(1), 10);

  try {
    const [canciones, fondos] = await Promise.all([cargarCanciones(), obtenerFondos()]);
    cancion = canciones.find(c => c.n === n);
    if (!cancion) throw new Error('No encontré esa canción en la hoja.');
    listaFondos = fondos;
    sacarFondo = crearBaraja(fondos);
  } catch (e) {
    mostrarAviso(e.message);
    return;
  }

  document.title = cancion.titulo;
  el.titulo.textContent = cancion.titulo;
  el.aviso.hidden = true;

  cambiarFondo();            // un fondo para toda la canción
  mostrar(0);
  conectarControles();
  pantallaCompleta();
}

/* --- Diapositivas ------------------------------------------------------ */

function mostrar(i) {
  indice = Math.max(0, Math.min(i, cancion.diapositivas.length - 1));

  el.letra.classList.remove('entra');
  void el.letra.offsetWidth;                     // reinicia la animación
  el.letra.innerHTML = formatearVersos(cancion.diapositivas[indice]);
  el.letra.classList.add('entra');

  ajustarTamano();

  el.contador.textContent = `${indice + 1} / ${cancion.diapositivas.length}`;
  el.progreso.style.width = `${((indice + 1) / cancion.diapositivas.length) * 100}%`;
  el.anterior.disabled  = indice === 0;
  el.siguiente.disabled = indice === cancion.diapositivas.length - 1;

  if (CONFIG.FONDO_POR_DIAPOSITIVA) cambiarFondo();
}

export function avanzar()   { if (indice < cancion.diapositivas.length - 1) mostrar(indice + 1); }
export function retroceder(){ if (indice > 0) mostrar(indice - 1); }

/* Ajusta el cuerpo de letra hasta que la estrofa completa quepa en pantalla.
   Búsqueda binaria: 14 pasos bastan y es imperceptible. */
function ajustarTamano() {
  const caja = el.letra.parentElement;
  let min = 16, max = Math.round(caja.clientHeight / 3.2);

  for (let paso = 0; paso < 14; paso++) {
    const medio = (min + max) / 2;
    el.letra.style.fontSize = `${medio}px`;
    const cabe = el.letra.scrollHeight <= caja.clientHeight &&
                 el.letra.scrollWidth  <= caja.clientWidth;
    if (cabe) min = medio; else max = medio;
  }
  el.letra.style.fontSize = `${min}px`;
}

function formatearVersos(texto) {
  return texto
    .replace(/\u00a0/g, ' ')          // espacios duros que Sheets a veces pega
    .split('\n')
    .map(l => l.trim())
    .filter(l => l !== '')
    .map(l => {
      // //verso// es la notación de repetición de los himnarios
      const cuerpo = escapar(l)
        .replace(/\/\/(.+?)\/\//g,
                 '<span class="repite">$1</span>');
      return `<span class="verso">${cuerpo}</span>`;
    })
    .join('');
}

function escapar(s) {
  return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

/* --- Fondos ------------------------------------------------------------ */

function cambiarFondo() {
  const fondo = sacarFondo();
  if (!fondo) return;

  const entra = capaActiva === 'a' ? el.fondoB : el.fondoA;
  const sale  = capaActiva === 'a' ? el.fondoA : el.fondoB;
  entra.innerHTML = '';

  if (fondo.tipo === 'video') {
    const v = document.createElement('video');
    Object.assign(v, { src: urlVideo(fondo.id), autoplay: true, muted: true,
                       loop: true, playsInline: true });
    v.setAttribute('playsinline', '');
    v.onerror = () => entra.style.background = 'transparent';
    entra.appendChild(v);
  } else {
    const img = document.createElement('img');
    img.src = urlImagen(fondo.id);
    img.alt = '';
    img.onerror = () => { img.onerror = null; img.src = urlImagenAlterna(fondo.id); };
    entra.appendChild(img);
  }

  entra.classList.add('visible');
  sale.classList.remove('visible');
  capaActiva = capaActiva === 'a' ? 'b' : 'a';

  // Calienta la caché con otro fondo cualquiera, por si toca cambiar
  if (listaFondos.length > 1) {
    precargar(listaFondos[Math.floor(Math.random() * listaFondos.length)]);
  }
}

/* --- Controles --------------------------------------------------------- */

function conectarControles() {
  el.anterior.addEventListener('click', retroceder);
  el.siguiente.addEventListener('click', avanzar);

  document.addEventListener('keydown', e => {
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
        e.preventDefault(); avanzar(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
        e.preventDefault(); retroceder(); break;
      case 'Home': mostrar(0); break;
      case 'End':  mostrar(cancion.diapositivas.length - 1); break;
      case 'b': case 'B': case '.': alternarNegro(); break;
      case 'f': case 'F': pantallaCompleta(); break;
      case 'Escape': volver(); break;
    }
  });

  // Deslizar en tabletas y teléfonos
  let x0 = null;
  el.escenario.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
  el.escenario.addEventListener('touchend', e => {
    if (x0 === null) return;
    const d = e.changedTouches[0].clientX - x0;
    if (Math.abs(d) > 60) (d < 0 ? avanzar : retroceder)();
    x0 = null;
  }, { passive: true });

  window.addEventListener('resize', ajustarTamano);
  window.addEventListener('orientationchange', () => setTimeout(ajustarTamano, 300));

  // Oculta el cursor cuando nadie toca nada
  let reloj;
  document.addEventListener('mousemove', () => {
    document.body.classList.remove('quieto');
    clearTimeout(reloj);
    reloj = setTimeout(() => document.body.classList.add('quieto'), 2500);
  });
}

function alternarNegro() {
  enNegro = !enNegro;
  document.body.classList.toggle('negro', enNegro);
}

export function volver() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  location.href = 'index.html';
}

async function pantallaCompleta() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    if (screen.orientation?.lock) await screen.orientation.lock('landscape');
  } catch { /* el navegador lo permitirá tras el primer clic */ }
}

function mostrarAviso(texto) {
  el.aviso.hidden = false;
  el.aviso.querySelector('p').textContent = texto;
}

/* Reintenta pantalla completa en el primer toque, por si el navegador
   bloqueó la petición automática. */
document.addEventListener('click', function primerToque() {
  pantallaCompleta();
  document.removeEventListener('click', primerToque);
}, { once: true });

window.addEventListener('hashchange', () => location.reload());
