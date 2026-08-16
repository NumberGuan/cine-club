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
