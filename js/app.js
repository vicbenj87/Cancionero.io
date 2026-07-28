/* ============================================================================
   app.js · Cancionero digital — índice y visor de diapositivas
   ----------------------------------------------------------------------------
   Decisiones que explican el resto del archivo:

   · Solo hay una diapositiva en el DOM. Da igual que el repertorio tenga 7 o
     349 canciones de 22 estrofas: nunca se construyen 7.678 nodos, se cambia
     el texto de uno. La memoria y el tiempo de arranque no dependen del
     tamaño del cancionero.

   · El fondo se sortea al abrir la canción, no al cambiar de diapositiva, y se
     recuerdan los últimos elegidos para no repetir ambiente dentro de un culto.

   · El tamaño de letra se calcula por búsqueda binaria contra el alto real de
     la pantalla. Una estrofa de dos líneas se ve enorme; una de ocho encoge
     lo justo para caber. Nunca hay texto cortado.

   · La navegación vive en el hash (#/c/12/3). Se puede recargar, compartir un
     enlace o dejar una canción abierta en un marcador.
   ========================================================================== */

(function () {
  'use strict';

  var CFG = window.CANCIONERO_CONFIG;
  var DATOS = window.CANCIONERO_DATA;

  /* ======================================================================
     Utilidades
     ====================================================================== */

  function $(sel) { return document.querySelector(sel); }

  /** Quita acentos y pasa a minúsculas: "Canción" y "cancion" buscan igual. */
  function normalizar(txt) {
    return String(txt)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function dosDigitos(n) { return String(n).padStart(2, '0'); }

  function retardar(fn, ms) {
    var id;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(id);
      id = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  function aleatorio(max) { return Math.floor(Math.random() * max); }

  /* ======================================================================
     Estado
     ====================================================================== */

  var estado = {
    canciones: [],        // repertorio saneado
    visibles: [],         // resultado del filtro + búsqueda
    filtro: CFG.indice.filtroInicial,
    busqueda: '',
    cancion: null,        // canción abierta en el visor
    indice: 0,            // diapositiva actual (0-based)
    fondosRecientes: [],  // claves de los últimos fondos usados
    enTransicion: false
  };

  var dom = {};
  var temporizadorInactividad = null;
  var temporizadorMedio = null;

  /* ======================================================================
     Carga y saneado de datos
     ----------------------------------------------------------------------
     El archivo de datos lo genera una persona con un editor: hay que asumir
     celdas vacías, tipos raros y estrofas de más. Se limpia una sola vez, al
     arrancar, y a partir de ahí el resto del código confía en la estructura.
     ====================================================================== */

  function cargarCanciones() {
    var crudas = (DATOS && Array.isArray(DATOS.canciones)) ? DATOS.canciones : [];
    var limpias = [];
    var maxDiapos = CFG.app.maxDiapositivas;

    for (var i = 0; i < crudas.length && limpias.length < CFG.app.maxCanciones; i++) {
      var c = crudas[i] || {};
      var titulo = String(c.titulo || '').trim();
      if (!titulo) { continue; }                       // sin título no hay canción

      var diapos = Array.isArray(c.diapositivas) ? c.diapositivas : [];
      diapos = diapos
        .map(function (d) { return String(d == null ? '' : d).replace(/\r\n/g, '\n').trim(); })
        .slice(0, maxDiapos);

      // Quita huecos finales vacíos, pero respeta los intermedios ya filtrados.
      diapos = diapos.filter(function (d) { return d.length > 0; });

      var tipo = parseInt(c.tipo, 10);
      if (tipo !== 1 && tipo !== 2 && tipo !== 3) { tipo = 1; }

      limpias.push({
        id: parseInt(c.id, 10) || (limpias.length + 1),
        titulo: titulo,
        tipo: tipo,
        diapositivas: diapos,
        // Campo precalculado para que buscar sea comparar cadenas, no normalizar.
        clave: normalizar(titulo)
      });
    }

    estado.canciones = limpias;
  }

  function buscarPorId(id) {
    for (var i = 0; i < estado.canciones.length; i++) {
      if (estado.canciones[i].id === id) { return estado.canciones[i]; }
    }
    return null;
  }

  /* ======================================================================
     Índice
     ====================================================================== */

  function filtrarCanciones() {
    var q = normalizar(estado.busqueda);
    var f = estado.filtro;

    estado.visibles = estado.canciones.filter(function (c) {
      // Tipo 3 ("Ambas") aparece en los dos filtros.
      var pasaTipo = (f === 0) || (c.tipo === f) || (c.tipo === 3);
      if (!pasaTipo) { return false; }
      if (!q) { return true; }
      return c.clave.indexOf(q) !== -1 || String(c.id) === q;
    });
  }

  /**
   * Tira de 22 marcas con las primeras `cantidad` llenas.
   * Es un solo nodo: el dibujo lo hace el CSS a partir de dos variables.
   */
  function crearMedidor(cantidad) {
    var PASO = 5;                              // píxeles por marca, igual que en app.css
    var medidor = document.createElement('span');
    medidor.className = 'medidor';
    medidor.setAttribute('aria-hidden', 'true');
    medidor.style.setProperty('--marcas', CFG.app.maxDiapositivas);
    medidor.style.setProperty('--llenado', (cantidad * PASO) + 'px');
    medidor.title = cantidad + ' de ' + CFG.app.maxDiapositivas + ' diapositivas';
    return medidor;
  }

  function renderIndice() {
    filtrarCanciones();

    var fragmento = document.createDocumentFragment();

    estado.visibles.forEach(function (c) {
      var li = document.createElement('li');

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cancion';
      btn.dataset.id = c.id;

      var num = document.createElement('span');
      num.className = 'cancion__numero';
      num.textContent = dosDigitos(c.id);

      var titulo = document.createElement('span');
      titulo.className = 'cancion__titulo';
      titulo.textContent = c.titulo;

      var tipo = document.createElement('span');
      tipo.className = 'etiqueta-tipo etiqueta-tipo--' + c.tipo;
      tipo.textContent = CFG.indice.tipos[c.tipo].abrev;

      btn.appendChild(num);
      btn.appendChild(titulo);
      btn.appendChild(crearMedidor(c.diapositivas.length));
      btn.appendChild(tipo);

      btn.setAttribute('aria-label',
        c.titulo + ', ' + c.diapositivas.length + ' diapositivas, ' + CFG.indice.tipos[c.tipo].nombre);

      li.appendChild(btn);
      fragmento.appendChild(li);
    });

    dom.lista.innerHTML = '';
    dom.lista.appendChild(fragmento);

    var hayResultados = estado.visibles.length > 0;
    dom.vacio.hidden = hayResultados;
    dom.lista.hidden = !hayResultados;
    dom.vacioTitulo.textContent = estado.canciones.length === 0
      ? 'Todavía no hay canciones'
      : 'Ninguna canción coincide';
    dom.vacioTexto.innerHTML = estado.canciones.length === 0
      ? 'Abre <code>editor.html</code>, escribe el repertorio y exporta <code>js/data/canciones.js</code>.'
      : 'Prueba con otras palabras del título o cambia el filtro.';

    dom.cifraTotal.textContent = estado.canciones.length;
  }

  /* ======================================================================
     Fondos
     ----------------------------------------------------------------------
     Siempre se pinta primero un fondo CSS. Si toca imagen o vídeo, se carga
     encima y solo se muestra cuando está listo: así jamás se ve una pantalla
     negra esperando un archivo que quizá ni exista.
     ====================================================================== */

  function elegirFamilia() {
    var estrategia = CFG.fondos.estrategia;
    if (estrategia !== 'mixto') { return estrategia; }

    var pesos = CFG.fondos.pesos;
    var total = pesos.css + pesos.imagen + pesos.video;
    var tirada = aleatorio(total);
    if (tirada < pesos.css) { return 'css'; }
    if (tirada < pesos.css + pesos.imagen) { return 'imagen'; }
    return 'video';
  }

  /**
   * Devuelve un índice de la familia evitando los últimos usados.
   * Si todos están "recientes" (repertorio corto), acepta cualquiera.
   */
  function elegirIndiceSinRepetir(familia, longitud) {
    if (longitud <= 0) { return -1; }
    var memoria = Math.min(CFG.fondos.memoriaSinRepetir, longitud - 1);
    for (var intento = 0; intento < 40; intento++) {
      var i = aleatorio(longitud);
      if (estado.fondosRecientes.indexOf(familia + ':' + i) === -1) {
        estado.fondosRecientes.push(familia + ':' + i);
        while (estado.fondosRecientes.length > memoria) { estado.fondosRecientes.shift(); }
        return i;
      }
    }
    return aleatorio(longitud);
  }

  function limpiarMedios() {
    clearTimeout(temporizadorMedio);
    dom.fondoImagen.removeAttribute('data-activo');
    dom.fondoImagen.removeAttribute('src');
    dom.fondoVideo.removeAttribute('data-activo');
    dom.fondoVideo.pause();
    dom.fondoVideo.removeAttribute('src');
    dom.fondoVideo.load();
  }

  function aplicarFondoCss() {
    var n = elegirIndiceSinRepetir('css', CFG.fondos.totalCss) + 1;
    dom.capaFondo.className = 'capa-fondo fondo--' + dosDigitos(n);
  }

  function aplicarFondo() {
    limpiarMedios();
    aplicarFondoCss();                       // base garantizada

    var familia = elegirFamilia();
    if (familia === 'css') { return; }

    var lista = familia === 'imagen' ? CFG.fondos.imagenes : CFG.fondos.videos;
    var i = elegirIndiceSinRepetir(familia, lista.length);
    if (i < 0) { return; }
    var ruta = lista[i];

    var caducado = false;
    temporizadorMedio = setTimeout(function () { caducado = true; }, CFG.fondos.tiempoEsperaMedio);

    if (familia === 'imagen') {
      var precarga = new Image();
      precarga.onload = function () {
        if (caducado) { return; }
        clearTimeout(temporizadorMedio);
        dom.fondoImagen.src = ruta;
        dom.fondoImagen.setAttribute('data-activo', 'true');
      };
      precarga.onerror = function () { /* se queda el fondo CSS */ };
      precarga.src = ruta;
    } else {
      dom.fondoVideo.src = ruta;
      dom.fondoVideo.addEventListener('canplay', function alListo() {
        dom.fondoVideo.removeEventListener('canplay', alListo);
        if (caducado) { return; }
        clearTimeout(temporizadorMedio);
        dom.fondoVideo.setAttribute('data-activo', 'true');
        var promesa = dom.fondoVideo.play();
        if (promesa && promesa.catch) { promesa.catch(function () {}); }
      });
      dom.fondoVideo.load();
    }
  }

  /* ======================================================================
     Ajuste tipográfico
     ----------------------------------------------------------------------
     Búsqueda binaria del mayor tamaño que cabe. Nueve pasadas bastan para
     acertar con menos de 1 px de error entre 20 y 160 px.
     ====================================================================== */

  function ajustarTipografia() {
    var el = dom.diapositiva;
    var min = CFG.visor.tipografia.min;
    var max = CFG.visor.tipografia.max;
    var mejor = min;

    for (var paso = 0; paso < 9; paso++) {
      var medio = (min + max) / 2;
      el.style.fontSize = medio + 'px';
      var cabe = (el.scrollHeight <= el.clientHeight + 1) &&
                 (el.scrollWidth <= el.clientWidth + 1);
      if (cabe) { mejor = medio; min = medio; } else { max = medio; }
    }

    el.style.fontSize = Math.floor(mejor) + 'px';
  }

  /* ======================================================================
     Visor
     ====================================================================== */

  function abrirCancion(id, indiceDiapositiva) {
    var cancion = buscarPorId(id);
    if (!cancion) { volverAlIndice(); return; }

    var esNueva = !estado.cancion || estado.cancion.id !== cancion.id;
    estado.cancion = cancion;
    estado.indice = Math.min(Math.max(indiceDiapositiva || 0, 0),
                             Math.max(cancion.diapositivas.length - 1, 0));

    if (esNueva) { aplicarFondo(); }         // el ambiente cambia por canción

    document.body.classList.add('visor-abierto');
    dom.visor.setAttribute('data-abierto', 'true');
    dom.visor.setAttribute('aria-hidden', 'false');
    dom.visorTitulo.textContent = cancion.titulo;

    pintarDiapositiva(false);
    cerrarLetraCompleta();
    reiniciarInactividad();

    if (CFG.visor.pantallaCompletaAuto) { entrarPantallaCompleta(); }

    // El foco va donde sirva: a "siguiente" si hay más estrofas, si no a "salir".
    var destino = dom.btnSiguiente.disabled ? dom.btnSalir : dom.btnSiguiente;
    destino.focus({ preventScroll: true });
  }

  function pintarDiapositiva(conTransicion) {
    var cancion = estado.cancion;
    if (!cancion) { return; }

    var total = cancion.diapositivas.length;
    var texto = total ? cancion.diapositivas[estado.indice] : '(Esta canción todavía no tiene letra)';

    function pintar() {
      dom.diapositiva.textContent = texto;
      ajustarTipografia();
      dom.visor.removeAttribute('data-transicion');
      estado.enTransicion = false;
    }

    if (conTransicion) {
      estado.enTransicion = true;
      dom.visor.setAttribute('data-transicion', 'true');
      setTimeout(pintar, 200);
    } else {
      pintar();
    }

    dom.contador.textContent = total ? (estado.indice + 1) + ' / ' + total : '—';
    dom.btnAnterior.disabled = estado.indice <= 0;
    dom.btnSiguiente.disabled = estado.indice >= total - 1;
  }

  function irADiapositiva(nuevo) {
    var total = estado.cancion ? estado.cancion.diapositivas.length : 0;
    if (nuevo < 0 || nuevo > total - 1 || nuevo === estado.indice || estado.enTransicion) { return; }
    estado.indice = nuevo;
    pintarDiapositiva(true);
    actualizarHash();
  }

  function siguiente() { irADiapositiva(estado.indice + 1); }
  function anterior() { irADiapositiva(estado.indice - 1); }

  /* --- Letra completa (vertical, solo scroll) ---------------------------- */

  function abrirLetraCompleta() {
    var cancion = estado.cancion;
    if (!cancion) { return; }

    var contenedor = dom.letraInterior;
    contenedor.innerHTML = '';

    var titulo = document.createElement('h2');
    titulo.className = 'panel-letra__titulo';
    titulo.textContent = cancion.titulo;
    contenedor.appendChild(titulo);

    if (!cancion.diapositivas.length) {
      var aviso = document.createElement('p');
      aviso.className = 'estrofa';
      aviso.textContent = 'Esta canción todavía no tiene letra.';
      contenedor.appendChild(aviso);
    }

    cancion.diapositivas.forEach(function (texto, i) {
      var bloque = document.createElement('p');
      bloque.className = 'estrofa';
      var num = document.createElement('span');
      num.className = 'estrofa__numero';
      num.textContent = dosDigitos(i + 1);
      bloque.appendChild(num);
      bloque.appendChild(document.createTextNode(texto));
      contenedor.appendChild(bloque);
    });

    dom.panelLetra.setAttribute('data-abierto', 'true');
    dom.panelLetra.scrollTop = 0;
    dom.cerrarLetra.focus({ preventScroll: true });
  }

  function cerrarLetraCompleta() {
    dom.panelLetra.setAttribute('data-abierto', 'false');
  }

  function letraAbierta() {
    return dom.panelLetra.getAttribute('data-abierto') === 'true';
  }

  function alternarLetraCompleta() {
    if (letraAbierta()) { cerrarLetraCompleta(); } else { abrirLetraCompleta(); }
  }

  /* --- Salida ------------------------------------------------------------ */

  function cerrarVisor() {
    limpiarMedios();
    cerrarLetraCompleta();
    dom.visor.setAttribute('data-abierto', 'false');
    dom.visor.setAttribute('aria-hidden', 'true');
    dom.visor.removeAttribute('data-negro');
    document.body.classList.remove('visor-abierto');
    estado.cancion = null;
    salirPantallaCompleta();
  }

  function volverAlIndice() {
    if (location.hash && location.hash !== '#/') {
      location.hash = '#/';                  // el router se encarga de cerrar
    } else {
      cerrarVisor();
    }
  }

  /* ======================================================================
     Pantalla completa y orientación
     ====================================================================== */

  function entrarPantallaCompleta() {
    var el = document.documentElement;
    var pedir = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (!pedir || document.fullscreenElement) { bloquearOrientacion(); return; }
    try {
      var p = pedir.call(el);
      if (p && p.then) { p.then(bloquearOrientacion).catch(function () {}); }
      else { bloquearOrientacion(); }
    } catch (e) { /* algunos navegadores lo prohíben; seguimos en ventana */ }
  }

  function salirPantallaCompleta() {
    try { if (screen.orientation && screen.orientation.unlock) { screen.orientation.unlock(); } } catch (e) {}
    var salir = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (salir && document.fullscreenElement) {
      try { salir.call(document); } catch (e) {}
    }
  }

  function bloquearOrientacion() {
    if (!CFG.visor.bloquearHorizontal) { return; }
    try {
      if (screen.orientation && screen.orientation.lock) {
        var p = screen.orientation.lock('landscape');
        if (p && p.catch) { p.catch(function () {}); }   // iOS no lo permite: da igual
      }
    } catch (e) {}
  }

  function alternarPantallaCompleta() {
    if (document.fullscreenElement) { salirPantallaCompleta(); } else { entrarPantallaCompleta(); }
  }

  /* ======================================================================
     Controles que se esconden solos
     ====================================================================== */

  function reiniciarInactividad() {
    var espera = CFG.visor.ocultarControlesTrasMs;
    dom.visor.removeAttribute('data-inactivo');
    clearTimeout(temporizadorInactividad);
    if (!espera) { return; }
    temporizadorInactividad = setTimeout(function () {
      if (!letraAbierta()) { dom.visor.setAttribute('data-inactivo', 'true'); }
    }, espera);
  }

  /* ======================================================================
     Enrutado por hash:  #/  ·  #/c/<id>/<diapositiva>
     ====================================================================== */

  function actualizarHash() {
    if (!estado.cancion) { return; }
    var nuevo = '#/c/' + estado.cancion.id + '/' + (estado.indice + 1);
    if (location.hash !== nuevo) {
      history.replaceState(null, '', nuevo);   // pasar estrofa no llena el historial
    }
  }

  function leerRuta() {
    var partes = (location.hash || '').replace(/^#\/?/, '').split('/');
    if (partes[0] === 'c' && partes[1]) {
      abrirCancion(parseInt(partes[1], 10), (parseInt(partes[2], 10) || 1) - 1);
    } else {
      cerrarVisor();
    }
  }

  /* ======================================================================
     Eventos
     ====================================================================== */

  function conectarEventos() {

    /* --- Índice --------------------------------------------------------- */
    dom.lista.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.cancion');
      if (!btn) { return; }
      location.hash = '#/c/' + btn.dataset.id + '/1';
    });

    dom.busqueda.addEventListener('input', retardar(function (ev) {
      estado.busqueda = ev.target.value;
      renderIndice();
    }, 120));

    dom.filtros.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.filtro');
      if (!btn) { return; }
      estado.filtro = parseInt(btn.dataset.filtro, 10);
      Array.prototype.forEach.call(dom.filtros.querySelectorAll('.filtro'), function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      renderIndice();
    });

    /* --- Visor ---------------------------------------------------------- */
    dom.btnSiguiente.addEventListener('click', siguiente);
    dom.btnAnterior.addEventListener('click', anterior);
    dom.btnLetra.addEventListener('click', alternarLetraCompleta);
    dom.cerrarLetra.addEventListener('click', cerrarLetraCompleta);
    dom.btnPantalla.addEventListener('click', alternarPantallaCompleta);
    dom.btnSalir.addEventListener('click', volverAlIndice);

    ['mousemove', 'pointerdown', 'keydown', 'wheel'].forEach(function (evt) {
      dom.visor.addEventListener(evt, reiniciarInactividad, { passive: true });
    });

    /* --- Teclado -------------------------------------------------------- */
    document.addEventListener('keydown', function (ev) {
      var enVisor = dom.visor.getAttribute('data-abierto') === 'true';

      if (!enVisor) {
        // "/" enfoca el buscador sin escribir la barra.
        if (ev.key === '/' && document.activeElement !== dom.busqueda) {
          ev.preventDefault();
          dom.busqueda.focus();
        }
        return;
      }

      switch (ev.key) {
        case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
          if (letraAbierta()) { return; }        // en la letra, el espacio hace scroll
          ev.preventDefault(); siguiente(); break;
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
          if (letraAbierta()) { return; }
          ev.preventDefault(); anterior(); break;
        case 'Home':
          ev.preventDefault(); irADiapositiva(0); break;
        case 'End':
          ev.preventDefault(); irADiapositiva(estado.cancion.diapositivas.length - 1); break;
        case 'Escape':
          if (letraAbierta()) { cerrarLetraCompleta(); } else { volverAlIndice(); }
          break;
        case 'l': case 'L':
          ev.preventDefault(); alternarLetraCompleta(); break;
        case 'f': case 'F':
          ev.preventDefault(); alternarPantallaCompleta(); break;
        case 'b': case 'B': case '.':
          // Pantalla en negro: para orar o para hablar sin distracción.
          ev.preventDefault();
          dom.visor.setAttribute('data-negro',
            dom.visor.getAttribute('data-negro') === 'true' ? 'false' : 'true');
          break;
      }
    });

    /* --- Gestos táctiles ------------------------------------------------ */
    if (CFG.visor.gestosTactiles) {
      var inicioX = 0, inicioY = 0, tocando = false;

      dom.escena.addEventListener('touchstart', function (ev) {
        if (ev.touches.length !== 1) { return; }
        tocando = true;
        inicioX = ev.touches[0].clientX;
        inicioY = ev.touches[0].clientY;
      }, { passive: true });

      dom.escena.addEventListener('touchend', function (ev) {
        if (!tocando) { return; }
        tocando = false;
        var dx = ev.changedTouches[0].clientX - inicioX;
        var dy = ev.changedTouches[0].clientY - inicioY;
        // Solo cuenta como paso si el gesto es claramente horizontal.
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) { return; }
        if (dx < 0) { siguiente(); } else { anterior(); }
      }, { passive: true });
    }

    /* --- Reajustes ------------------------------------------------------ */
    var reajustar = retardar(function () {
      if (dom.visor.getAttribute('data-abierto') === 'true') { ajustarTipografia(); }
    }, 120);

    window.addEventListener('resize', reajustar);
    window.addEventListener('orientationchange', reajustar);
    document.addEventListener('fullscreenchange', reajustar);

    window.addEventListener('hashchange', leerRuta);
  }

  /* ======================================================================
     Arranque
     ====================================================================== */

  function iniciar() {
    dom = {
      lista:        $('#lista'),
      vacio:        $('#vacio'),
      vacioTitulo:  $('#vacio-titulo'),
      vacioTexto:   $('#vacio-texto'),
      busqueda:     $('#busqueda'),
      filtros:      $('#filtros'),
      cifraTotal:   $('#cifra-total'),
      cifraFondos:  $('#cifra-fondos'),

      visor:        $('#visor'),
      capaFondo:    $('#capa-fondo'),
      fondoImagen:  $('#fondo-imagen'),
      fondoVideo:   $('#fondo-video'),
      escena:       $('#escena'),
      diapositiva:  $('#diapositiva'),
      visorTitulo:  $('#visor-titulo'),
      contador:     $('#contador'),
      btnAnterior:  $('#btn-anterior'),
      btnSiguiente: $('#btn-siguiente'),
      btnLetra:     $('#btn-letra'),
      btnPantalla:  $('#btn-pantalla'),
      btnSalir:     $('#btn-salir'),
      panelLetra:   $('#panel-letra'),
      letraInterior:$('#letra-interior'),
      cerrarLetra:  $('#cerrar-letra')
    };

    if (!CFG || !DATOS) {
      console.error('Falta config.js o js/data/canciones.js.');
      return;
    }

    cargarCanciones();
    dom.cifraFondos.textContent = CFG.fondos.totalCss;

    // Deja marcado el filtro inicial que diga la configuración.
    Array.prototype.forEach.call(dom.filtros.querySelectorAll('.filtro'), function (b) {
      b.setAttribute('aria-pressed', String(parseInt(b.dataset.filtro, 10) === estado.filtro));
    });

    renderIndice();
    conectarEventos();
    leerRuta();                                // respeta un enlace directo
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
