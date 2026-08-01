import { useEffect, useMemo, useRef, useState } from "react";
import { BUCLE_DIAPOSITIVAS, OCULTAR_CONTROLES_TRAS_MS, PARPADEO_INICIAL_MS } from "@/config";
import { useAutoFitText } from "@/hooks/useAutoFitText";
import { useFullscreen } from "@/hooks/useFullscreen";
import { irAIndice, irALetra } from "@/hooks/useHashRoute";
import type { Song } from "@/types";
import { fondoParaCancion } from "@/utils/backgrounds";

export function PlayerView({
  song,
  slideInicial,
  onCambiarSlide,
}: {
  song: Song;
  slideInicial: number;
  onCambiarSlide: (numero: number) => void;
}) {
  const total = song.slides.length;
  const [posicion, setPosicion] = useState(() =>
    Math.min(Math.max(slideInicial - 1, 0), Math.max(total - 1, 0))
  );
  const [negro, setNegro] = useState(false);
  const [controlesVisibles, setControlesVisibles] = useState(true);
  const [parpadeando, setParpadeando] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const ocultarTimeout = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const { toggle: toggleFullscreen } = useFullscreen();

  const slideActual = song.slides[posicion];
  const fondo = useMemo(() => fondoParaCancion(song.id), [song.id]);

  useEffect(() => {
    onCambiarSlide(posicion + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posicion]);

  useEffect(() => {
    setPosicion(Math.min(Math.max(slideInicial - 1, 0), Math.max(total - 1, 0)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song.id]);

  useEffect(() => {
    const t = window.setTimeout(() => setParpadeando(false), PARPADEO_INICIAL_MS);
    return () => window.clearTimeout(t);
  }, [song.id]);

  const lineas = (slideActual?.texto || "").split("\n").filter((l) => l.trim().length > 0);
  const { containerRef: fitContainer, measureRef, fontSize } = useAutoFitText<
    HTMLDivElement,
    HTMLDivElement
  >([slideActual?.texto, posicion], { min: 20, max: 96 });

  function siguiente() {
    setPosicion((p) => {
      if (p >= total - 1) return BUCLE_DIAPOSITIVAS ? 0 : p;
      return p + 1;
    });
  }
  function anterior() {
    setPosicion((p) => {
      if (p <= 0) return BUCLE_DIAPOSITIVAS ? total - 1 : 0;
      return p - 1;
    });
  }

  function mostrarControlesTemporalmente() {
    setControlesVisibles(true);
    setParpadeando(false);
    if (ocultarTimeout.current) window.clearTimeout(ocultarTimeout.current);
    ocultarTimeout.current = window.setTimeout(() => {
      setControlesVisibles(false);
    }, OCULTAR_CONTROLES_TRAS_MS);
  }

  useEffect(() => {
    mostrarControlesTemporalmente();
    return () => {
      if (ocultarTimeout.current) window.clearTimeout(ocultarTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "PageDown":
          e.preventDefault();
          siguiente();
          mostrarControlesTemporalmente();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          anterior();
          mostrarControlesTemporalmente();
          break;
        case "Home":
          setPosicion(0);
          mostrarControlesTemporalmente();
          break;
        case "End":
          setPosicion(total - 1);
          mostrarControlesTemporalmente();
          break;
        case "l":
        case "L":
          irALetra(song.id);
          break;
        case "b":
        case "B":
        case ".":
          setNegro((n) => !n);
          break;
        case "f":
        case "F":
          toggleFullscreen(rootRef.current);
          break;
        case "Escape":
          if (document.fullscreenElement) {
            document.exitFullscreen?.();
          } else {
            irAIndice();
          }
          break;
        default:
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, song.id]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) siguiente();
      else anterior();
    }
    touchStartX.current = null;
    mostrarControlesTemporalmente();
  }

  if (!slideActual) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-950 text-slate-200">
        <p>Esta canción no tiene diapositivas cargadas todavía.</p>
        <button onClick={irAIndice} className="rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white">
          Volver al índice
        </button>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative min-h-screen overflow-hidden text-white select-none"
      onMouseMove={mostrarControlesTemporalmente}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* fondo animado */}
      <div
        className="absolute inset-0 -z-10 fondo-animado"
        style={{
          backgroundImage: fondo.gradient,
          backgroundSize: "200% 200%",
          animationDuration: `${fondo.duracionS}s`,
        }}
      />
      <div className="absolute inset-0 -z-10 bg-black/20" />

      {negro && <div className="absolute inset-0 z-30 bg-black" />}

      {/* barra superior */}
      <div
        className={`absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent px-4 py-3 transition-opacity duration-500 ${
          controlesVisibles ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={irAIndice}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur transition hover:bg-white/20"
        >
          ← Índice
        </button>
        <p className="max-w-[50%] truncate text-center text-sm font-medium sm:text-base">
          {song.titulo}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => irALetra(song.id)}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur transition hover:bg-white/20"
          >
            Letra completa
          </button>
          <button
            onClick={() => toggleFullscreen(rootRef.current)}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur transition hover:bg-white/20"
          >
            ⛶
          </button>
        </div>
      </div>

      {/* texto de la diapositiva, autoajustado */}
      <div
        ref={(el) => {
          containerRef.current = el;
          fitContainer.current = el;
        }}
        className="flex h-screen w-full items-center justify-center px-6 sm:px-16"
      >
        <div
          className="text-center font-semibold leading-tight drop-shadow-lg"
          style={{ fontSize: `${fontSize}px` }}
        >
          {lineas.map((linea, i) => (
            <p key={i}>{linea}</p>
          ))}
        </div>
      </div>

      {/* medidor invisible para calcular el tamaño de letra */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute -left-[9999px] -top-[9999px] w-[calc(100vw-8rem)] text-center font-semibold leading-tight"
      >
        {lineas.map((linea, i) => (
          <p key={i}>{linea}</p>
        ))}
      </div>

      {/* flechas de navegación */}
      <button
        onClick={anterior}
        aria-label="Diapositiva anterior"
        className={`absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-3 backdrop-blur transition sm:left-6 ${
          controlesVisibles ? "opacity-100" : "opacity-0"
        } ${parpadeando ? "animate-pulse" : ""} hover:bg-white/20`}
      >
        ‹
      </button>
      <button
        onClick={siguiente}
        aria-label="Diapositiva siguiente"
        className={`absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-3 backdrop-blur transition sm:right-6 ${
          controlesVisibles ? "opacity-100" : "opacity-0"
        } ${parpadeando ? "animate-pulse" : ""} hover:bg-white/20`}
      >
        ›
      </button>

      {/* indicador de progreso */}
      <div
        className={`absolute inset-x-0 bottom-4 z-20 flex justify-center transition-opacity duration-500 ${
          controlesVisibles ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="rounded-full bg-black/40 px-3 py-1 text-xs backdrop-blur">
          {posicion + 1} / {total}
        </span>
      </div>

      {/* aviso de orientación en móvil vertical */}
      <div className="pointer-events-none absolute inset-0 z-40 hidden items-center justify-center bg-black/90 text-center text-sm [@media(orientation:portrait)]:flex md:hidden">
        <p className="px-8">Gira el dispositivo a horizontal para proyectar 📱↻</p>
      </div>
    </div>
  );
}
