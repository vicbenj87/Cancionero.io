import { PantallaCargando, PantallaError } from "@/components/EstadoCarga";
import { useHashRoute, irAIndice } from "@/hooks/useHashRoute";
import { useSongs } from "@/hooks/useSongs";
import { IndexView } from "@/pages/IndexView";
import { LyricsView } from "@/pages/LyricsView";
import { PlayerView } from "@/pages/PlayerView";

export default function App() {
  const { songs, loading, error, lastUpdated, fromCache, refresh } = useSongs();
  const route = useHashRoute();

  if (loading && songs.length === 0) {
    return <PantallaCargando />;
  }

  if (error && songs.length === 0) {
    return <PantallaError mensaje={error} onReintentar={refresh} />;
  }

  if (route.name === "player") {
    const song = songs.find((s) => s.id === route.id);
    if (!song) {
      irAIndice();
      return null;
    }
    return (
      <PlayerView
        key={song.id}
        song={song}
        slideInicial={route.slide}
        onCambiarSlide={(numero) => {
          const nuevoHash = `#/c/${song.id}/${numero}`;
          if (window.location.hash !== nuevoHash) {
            window.history.replaceState(null, "", nuevoHash);
          }
        }}
      />
    );
  }

  if (route.name === "letra") {
    const song = songs.find((s) => s.id === route.id);
    if (!song) {
      irAIndice();
      return null;
    }
    return <LyricsView song={song} />;
  }

  return (
    <IndexView
      songs={songs}
      loading={loading}
      fromCache={fromCache}
      lastUpdated={lastUpdated}
      error={error}
      onRefresh={refresh}
    />
  );
}


