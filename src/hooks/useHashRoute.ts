import { useEffect, useState } from "react";

export type Route =
  | { name: "index" }
  | { name: "player"; id: number; slide: number }
  | { name: "letra"; id: number };

function parseHash(hash: string): Route {
  const clean = hash.replace(/^#/, "");
  const parts = clean.split("/").filter(Boolean);

  if (parts[0] === "c" && parts[1]) {
    const id = parseInt(parts[1], 10);
    const slide = parts[2] ? parseInt(parts[2], 10) : 1;
    if (!Number.isNaN(id)) {
      return { name: "player", id, slide: Number.isNaN(slide) ? 1 : slide };
    }
  }

  if (parts[0] === "letra" && parts[1]) {
    const id = parseInt(parts[1], 10);
    if (!Number.isNaN(id)) return { name: "letra", id };
  }

  return { name: "index" };
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route;
}

export function irAIndice() {
  window.location.hash = "#/";
}

export function irAProyeccion(id: number, slide = 1) {
  window.location.hash = `#/c/${id}/${slide}`;
}

export function irALetra(id: number) {
  window.location.hash = `#/letra/${id}`;
}
