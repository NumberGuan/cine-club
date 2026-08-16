# CineClub

CineClub es una aplicación full stack para buscar películas reales, consultar
sus detalles y escribir reseñas personales con un puntaje del 1 al 5.

El proyecto está pensado como un parcial de Desarrollo Web Full Stack: prioriza
un código simple, directo y fácil de explicar.

## Funcionalidades

- Búsqueda de películas mediante TMDB.
- Detalle con sinopsis, duración y géneros.
- Creación y eliminación de reseñas.
- Promedio de los puntajes guardados.
- Interfaz responsive con estados de carga, error y contenido vacío.

Las reseñas se guardan en memoria. Se eliminan cada vez que se reinicia el
backend, de manera intencional.

## Tecnologías

### Frontend

- React
- Vite
- TypeScript
- CSS
- Motion para microinteracciones puntuales

### Backend

- Node.js
- Express
- TypeScript
- API de TMDB

## Requisitos

- Node.js 20 o una versión más reciente
- npm
- Una API key de [TMDB](https://www.themoviedb.org/settings/api)

## Backend

```bash
cd backend
npm install
```

Creá un archivo `backend/.env` a partir de `.env.example`:

```env
TMDB_API_KEY=tu_api_key
PORT=3001
```

Iniciá el servidor:

```bash
npm run dev
```

## Frontend

En otra terminal:

```bash
cd frontend
npm install
```

Creá un archivo `frontend/.env` a partir de `.env.example`:

```env
VITE_API_URL=http://localhost:3001
```

Iniciá la aplicación:

```bash
npm run dev
```

Después abrí la dirección local que muestra Vite en la terminal.

## Flujo de datos

```text
React → Express → TMDB
              ↘ reseñas en memoria
```

El frontend nunca accede directamente a TMDB. Todas las búsquedas pasan por
Express, por lo que la API key permanece únicamente en el backend.

## Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/movies/search?q=matrix` | Busca películas en TMDB |
| `GET` | `/api/movies/:tmdbId` | Obtiene el detalle y las reseñas locales |
| `POST` | `/api/movies/:tmdbId/reviews` | Agrega una reseña en memoria |
| `DELETE` | `/api/reviews/:reviewId` | Elimina una reseña local |

## Cómo se conectan las pantallas

La búsqueda empieza en `SearchBar`, llama a `searchMovies()` y muestra la
respuesta del backend mediante `MovieGrid`. Al elegir una tarjeta, `App` guarda
su identificador en `selectedMovieId` y renderiza `MovieDetail`.

El formulario de reseñas envía un `POST` al backend. Express valida los datos,
agrega la reseña al array en memoria y el frontend vuelve a cargar el detalle
para mostrar la lista y el promedio actualizados.
