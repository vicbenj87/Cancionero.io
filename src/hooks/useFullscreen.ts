import { useCallback, useEffect, useState } from "react";

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enter = useCallback((el?: HTMLElement | null) => {
    const target = el ?? document.documentElement;
    target.requestFullscreen?.().catch(() => {
      /* algunos navegadores móviles no lo permiten, se ignora */
    });
  }, []);

  const exit = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const toggle = useCallback(
    (el?: HTMLElement | null) => {
      if (document.fullscreenElement) exit();
      else enter(el);
    },
    [enter, exit]
  );

  return { isFullscreen, enter, exit, toggle };
}
