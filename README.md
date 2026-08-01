# Cancionero Online (sincronizado con Google Sheets)

Aplicación web que muestra, proyecta y permite leer un cancionero completo,
tomando los datos **automáticamente** desde una hoja de Google Sheets. No hay
que exportar ni subir ningún archivo de datos: cada vez que alguien abre la
página, se descargan las canciones más recientes directamente desde tu hoja.

## ¿Cómo funciona?

1. Compartes tu Google Sheet como "Cualquier usuario con el enlace puede ver".
2. La app pide, con `fetch`, el contenido de la pestaña `Cancionero_Online` en
   formato CSV usando la URL pública de Google:
   `https://docs.google.com/spreadsheets/d/TU_ID/gviz/tq?tqx=out:csv&sheet=Cancionero_Online`
3. Convierte cada fila en una canción: columna **Título**, columnas
   **Diapositiva 1** a **Diapositiva 22**, y columna **TIPO**
   (1 Dominical · 2 Santa Cena · 3 Ambas).
4. Se vuelve a consultar sola cada 5 minutos y también cada vez que se
   actualiza manualmente con el botón 🔄, así que cualquier cambio en la hoja
   se refleja sin tocar el código.

Todo el proyecto se compila en un único archivo `dist/index.html` (HTML, CSS
y JavaScript en uno solo), así que subirlo a GitHub Pages es tan simple como
copiar ese archivo.

Ver instrucciones completas paso a paso más abajo.
