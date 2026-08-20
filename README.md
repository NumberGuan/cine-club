# CineClub · Parcial 1: Desarrollo Web Full Stack

CineClub es una plataforma web full stack donde los usuarios pueden buscar películas reales consultando la API pública de TMDB (The Movie Database), visualizar sus detalles técnicos y escribir/eliminar reseñas locales con puntajes del 1 al 5 y cálculo de promedios en tiempo real.

---

## Arquitectura y Flujo de Datos

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ React Frontend  │ ────> │ Express Backend │ ────> │    TMDB API     │
└─────────────────┘       └────────┬────────┘       └─────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │ Array en Memoria│
                          │   (Reseñas)     │
                          └─────────────────┘
```

> **Aislamiento de API:** El frontend **nunca** llama a TMDB directamente. Todo el tráfico pasa por el servidor Express propio, manteniendo la clave `TMDB_API_KEY` segura en el backend y combinando los datos remotos con las reseñas locales en memoria.

---

## Requisitos Previos

- **Node.js**: v20.x o superior
- **npm**: v10.x o superior
- **API Key de TMDB** (gratuita):
  1. Crear una cuenta en [themoviedb.org](https://www.themoviedb.org).
  2. Ir a **Configuración > API** y solicitar una clave de tipo *Developer*.
  3. Copiar la *Clave de API* (v3 auth).

---

## Instalación y Puesta en Marcha

### 1. Backend (Express + Node.js)

1. Ingresar a la carpeta `backend` e instalar dependencias:
   ```bash
   cd backend
   npm install
   ```

2. Crear el archivo de variables de entorno `.env` en la raíz de `backend/` a partir de `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *En Windows (PowerShell):*
   ```powershell
   Copy-Item .env.example .env
   ```

3. Configurar tu clave de TMDB en `backend/.env`:
   ```env
   PORT=3001
   TMDB_API_KEY=tu_clave_de_tmdb_aqui
   ```

4. Iniciar el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
   *El servidor quedará escuchando en `http://localhost:3001`.*

---

### 2. Frontend (React + Vite + TypeScript)

1. En una nueva terminal, ingresar a la carpeta `frontend` e instalar dependencias:
   ```bash
   cd frontend
   npm install
   ```

2. Crear el archivo `.env` en la raíz de `frontend/` a partir de `.env.example` (opcional, por defecto apunta a `http://localhost:3001`):
   ```bash
   cp .env.example .env
   ```
   *En Windows (PowerShell):*
   ```powershell
   Copy-Item .env.example .env
   ```

3. Contenido de `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:3001
   ```

4. Iniciar el servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```

5. Abrir en el navegador la URL indicada por Vite (generalmente `http://localhost:5173`).

---

## Endpoints del Backend

| Método | Ruta | Descripción | Respuestas |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/movies/search?q=:query` | Busca películas en TMDB y agrega `avgScore` | `200 OK`, `400 Bad Request` |
| `GET` | `/api/movies/:tmdbId` | Detalle de película + reseñas locales + `avgScore` | `200 OK`, `404 Not Found` |
| `POST` | `/api/movies/:tmdbId/reviews` | Agrega una reseña en memoria (`author`, `score` 1-5, `comment`) | `201 Created`, `400 Bad Request` |
| `DELETE` | `/api/reviews/:reviewId` | Elimina una reseña por su ID | `204 No Content`, `404 Not Found` |
| `GET` | `/api/movies/featured/trending` | Películas trending para el carrusel | `200 OK` |

---

## Componentes del Frontend

El frontend está estructurado en componentes modulares con responsabilidades claras:

- **`SearchBar`**: Input de búsqueda y botón submit con control de estado y prevención de peticiones innecesarias.
- **`MovieGrid`**: Grilla de resultados de películas.
- **`MovieCard`**: Tarjeta individual que muestra póster, título, año y promedio de reseñas (`avgScore`).
- **`MovieDetail`**: Ficha técnica completa de la película seleccionada con sinopsis, duración, géneros y contenedor de reseñas.
- **`ReviewList`**: Listado de reseñas con autor, puntaje, comentario y opción de eliminación individual.
- **`ReviewForm`**: Formulario con validación en cliente (campos obligatorios y puntaje de 1 a 5) para publicar nuevas reseñas.
- **`Poster`**: Renderizado de imágenes de TMDB con fallback elegante ante afiches no disponibles.
- **`HeroCarousel`**: Carrusel de películas destacadas y buscador principal.
- **`StickyShowcase`**: Ficha interactiva con la arquitectura y pilares del proyecto.

---

## Verificación y Scripts

- **Backend Typecheck:** `cd backend && npm run typecheck`
- **Backend Build:** `cd backend && npm run build`
- **Frontend Typecheck & Build:** `cd frontend && npm run build`
