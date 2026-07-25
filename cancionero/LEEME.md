# Cancionero — guía de montaje

Índice de alabanzas + proyector a pantalla completa. La letra vive en una hoja
de Google, los fondos en una carpeta de Drive. Nada se escribe en el código.

---

## 1. La hoja de cálculo

Crea una hoja llamada **`CANCIONERO_BD`** con dos pestañas.

### Pestaña `Canciones`

| Título | Diapositiva 1 | Diapositiva 2 | Diapositiva 3 | … |
|---|---|---|---|---|
| Grande es tu fidelidad | *(estrofa 1)* | *(estrofa 2)* | *(coro)* | … |
| Sublime gracia | *(estrofa 1)* | *(estrofa 2)* | | |

- Una fila = una canción. El número de la canción sale del orden de las filas.
- Dentro de una celda, **Alt + Enter** (Mac: Ctrl + Option + Enter) hace un salto
  de línea. Cada línea es un verso.
- Deja columnas vacías al final sin problema: se ignoran.
- Regla de oro para que se lea desde la última banca: **4 líneas por
  diapositiva, 6 como máximo**. La app reduce el cuerpo de letra sola, así que
  una celda larguísima se verá diminuta.
- Puedes llegar a la columna **`IQ`** si hiciera falta; 250 filas no le pesan
  nada (el archivo completo ronda los 300 KB).

### Pestaña `Fondos`

| Nombre | ID de Drive | Tipo |
|---|---|---|
| Amanecer sobre el valle | `1a2B3c...` | imagen |
| Nubes en movimiento | `9z8Y7x...` | video |

En la columna del ID puedes pegar **la URL completa** de Drive; el código extrae
el ID solo.

### Compartir

Archivo → Compartir → **Cualquier persona con el enlace: Lector**.
Sin esto la app no puede leerla.

Copia el ID de la hoja desde la URL:
`docs.google.com/spreadsheets/d/` **`ESTE_TROZO_ES_EL_ID`** `/edit`

---

## 2. La carpeta de fondos en Drive

Crea una carpeta **`CANCIONERO_FONDOS`** y compártela también como
*Cualquier persona con el enlace: Lector*.

### Cómo obtener el ID de cada archivo
Clic derecho sobre el archivo → Compartir → Copiar vínculo. Del enlace
`drive.google.com/file/d/` **`ESTE_TROZO`** `/view` sale el ID.

### Dos formas de conectar los fondos

**A. Manual (recomendada, sin claves).** Pega los IDs en la pestaña `Fondos`.
Con 35 archivos son 35 líneas, se hace en diez minutos y no depende de
servicios externos.

**B. Automática.** Rellena `DRIVE_CARPETA_ID` y `DRIVE_API_KEY` en
`js/config.js`. La clave se saca en Google Cloud Console → APIs y servicios →
activa *Google Drive API* → Credenciales → Crear clave de API. Restringe la
clave a la Drive API y a tu dominio. La app leerá la carpeta sola y los fondos
nuevos aparecerán sin tocar nada.

### Recomendaciones de archivo

| | Formato | Tamaño | Nota |
|---|---|---|---|
| Imágenes | JPG o WebP | 1920×1080, 300–600 KB | Evita fotos con mucho detalle en el centro |
| Videos | MP4 (H.264) | **menos de 20 MB**, 10–20 s, en bucle | Sin audio |

**Sobre los videos, con toda honestidad:** Drive no es un servidor de video. Un
MP4 pequeño se reproduce bien, pero Drive limita las descargas y con archivos
grandes intercala una página de confirmación que rompe la reproducción. Si los
videos son parte importante del culto, súbelos a Cloudflare R2, Bunny, GitHub
Pages o incluso Cloudinary y pon esa URL directa. El código acepta cualquier
URL: si el valor de la columna *ID de Drive* ya es un enlace `.mp4` completo,
funciona igual. Con imágenes Drive va perfecto.

---

## 3. Configurar y publicar

1. Abre `js/config.js` y pega el `SHEET_ID`.
2. Sube la carpeta completa a un hosting estático. Opciones gratuitas:
   - **GitHub Pages** — sube el repo, activa Pages, listo.
   - **Netlify Drop** — arrastra la carpeta a netlify.com/drop.
   - **Cloudflare Pages**.
3. Si quieres mantener el Google Sites actual, incrusta la app con
   *Insertar → Insertar código* usando un `<iframe>` a tu URL. El proyector
   funciona mejor abierto en pestaña propia (la pantalla completa dentro de un
   iframe de Google Sites está restringida).

> Abrir `index.html` con doble clic **no funciona**: los módulos de JavaScript y
> las peticiones a Google exigen `http://` o `https://`. Para probar en tu PC:
> `python3 -m http.server 8000` dentro de la carpeta y entra a
> `http://localhost:8000`.

---

## 4. Manejo durante el servicio

| Tecla | Acción |
|---|---|
| `→` `↓` `Espacio` `AvPág` | Siguiente diapositiva |
| `←` `↑` `RePág` | Diapositiva anterior |
| `Inicio` / `Fin` | Primera / última |
| `B` o `.` | Pantalla en negro (y de vuelta) |
| `F` | Pantalla completa |
| `Esc` | Volver al índice |
| `/` (en el índice) | Ir al buscador |

Las flechas blancas semitransparentes están en las esquinas inferiores y
responden al toque en tabletas. También se puede deslizar el dedo.

Los controles remotos de presentaciones (los de USB para PowerPoint) envían
AvPág y RePág, así que funcionan sin configurar nada.

---

## 5. Estructura de archivos

```
cancionero/
├─ index.html          Índice
├─ proyector.html      Pantalla de proyección
├─ css/
│  ├─ base.css         Colores, tipografías, tokens
│  ├─ indice.css
│  └─ proyector.css
└─ js/
   ├─ config.js        ← el único que editas
   ├─ csv.js           Lector de CSV
   ├─ cache.js         Caché con vencimiento
   ├─ sheets.js        Lectura de la hoja
   ├─ fondos.js        Drive + sorteo aleatorio
   ├─ indice.js        Lista y búsqueda
   └─ proyector.js     Motor de diapositivas
```

---

## 6. Ajustes frecuentes en `config.js`

- `FONDO_POR_DIAPOSITIVA: true` — cambia la imagen en cada estrofa en vez de
  una por canción.
- `VELO: 0.6` — oscurece más el fondo si tu proyector lava los colores.
- `CACHE_MINUTOS: 0` — desactiva la caché mientras editas la letra.

El botón **Actualizar** del índice borra la caché y vuelve a leer la hoja: úsalo
si corregiste una letra minutos antes del servicio.

---

## 7. Cómo funciona el azar

Los fondos se reparten con una "bolsa": se barajan los 35 y se van sacando uno
por uno; hasta que no se agotan, ninguno se repite. Al vaciarse, se barajan de
nuevo. Es aleatorio, pero sin la sensación de que siempre sale la misma foto.
