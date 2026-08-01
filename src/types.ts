export type TipoCulto = 1 | 2 | 3 | 0;

export interface Slide {
  numero: number; // 1-indexado, coincide con "Diapositiva N"
  texto: string;
}

export interface Song {
  id: number; // número de fila de datos (1 = primera canción), estable para enlaces
  titulo: string;
  slides: Slide[]; // solo las diapositivas con contenido
  tipo: TipoCulto; // 1 Dominical · 2 Santa Cena · 3 Ambas · 0 sin definir
  tituloBusqueda: string;
  letraBusqueda: string;
}

export interface SearchMatch {
  song: Song;
  matchInTitle: boolean;
  matchSlideNumero?: number;
  matchSnippet?: string;
}

export interface FetchState {
  songs: Song[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  fromCache: boolean;
  refresh: () => void;
}
