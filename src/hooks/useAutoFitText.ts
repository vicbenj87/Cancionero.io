import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Calcula el tamaño de letra óptimo para que el texto quepa completo
 * dentro del contenedor, sin cortarse: una estrofa de 2 líneas se ve
 * enorme, una de 8 encoge lo justo. Se recalcula si cambian las
 * dependencias indicadas o si la ventana cambia de tamaño/orientación.
 */
export function useAutoFitText<T extends HTMLElement, M extends HTMLElement>(
  deps: unknown[],
  opts?: { min?: number; max?: number }
) {
  const containerRef = useRef<T | null>(null);
  const measureRef = useRef<M | null>(null);
  const [fontSize, setFontSize] = useState<number>(opts?.max ?? 64);
  const [resizeTick, setResizeTick] = useState(0);

  useEffect(() => {
    const onResize = () => setResizeTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const min = opts?.min ?? 14;
    const max = opts?.max ?? 92;

    let lo = min;
    let hi = max;
    let best = min;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (cw === 0 || ch === 0) return;

    measure.style.width = `${cw}px`;

    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      measure.style.fontSize = `${mid}px`;
      const fits = measure.scrollWidth <= cw && measure.scrollHeight <= ch;
      if (fits) {
        best = mid;
        lo = mid;
      } else {
        hi = mid;
      }
    }

    setFontSize(Math.max(min, Math.floor(best)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, resizeTick]);

  return { containerRef, measureRef, fontSize };
}
