const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_TIMEOUT_MS = 10_000;

interface TmdbSearchResponse {
  results?: TmdbMovie[];
}

interface TmdbMovie {
  id: number;
  title?: string;
  original_title?: string;
  release_date?: string;
  poster_path?: string | null;
  overview?: string;
  runtime?: number | null;
  genres?: Array<{ id: number; name: string }>;
}

export interface MovieSummary {
  id: number;
  title: string;
  year: number | null;
  posterPath: string | null;
  overview: string;
}

export interface MovieDetails extends MovieSummary {
  runtime: number | null;
  genres: string[];
}

export class TmdbConfigError extends Error {
  readonly statusCode = 503;

  constructor() {
    super("TMDB no está configurado en el servidor.");
    this.name = "TmdbConfigError";
  }
}

export class TmdbRequestError extends Error {
  readonly statusCode = 502;

  constructor() {
    super("No se pudo consultar TMDB.");
    this.name = "TmdbRequestError";
  }
}

export class TmdbNotFoundError extends Error {
  readonly statusCode = 404;

  constructor() {
    super("La película no existe en TMDB.");
    this.name = "TmdbNotFoundError";
  }
}

function getTmdbUrl(path: string, params: Record<string, string>): URL {
  const apiKey = process.env.TMDB_API_KEY?.trim();

  if (!apiKey) {
    throw new TmdbConfigError();
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "es-AR");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url;
}

async function requestTmdb<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = getTmdbUrl(path, params);
  let response: Response;

  try {
    response = await fetch(url, { signal: AbortSignal.timeout(TMDB_TIMEOUT_MS) });
  } catch {
    throw new TmdbRequestError();
  }

  if (response.status === 404) {
    throw new TmdbNotFoundError();
  }

  if (!response.ok) {
    throw new TmdbRequestError();
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new TmdbRequestError();
  }
}

function getYear(releaseDate?: string): number | null {
  if (!releaseDate) {
    return null;
  }

  const year = Number.parseInt(releaseDate.slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
}

function toMovieSummary(movie: TmdbMovie): MovieSummary {
  return {
    id: movie.id,
    title: movie.title ?? movie.original_title ?? "Sin título",
    year: getYear(movie.release_date),
    posterPath: movie.poster_path ?? null,
    overview: movie.overview ?? "",
  };
}

export async function searchMovies(query: string): Promise<MovieSummary[]> {
  const payload = await requestTmdb<TmdbSearchResponse>("/search/movie", {
    query,
    include_adult: "false",
  });

  return (payload.results ?? []).map(toMovieSummary);
}

export async function getMovieDetails(tmdbId: number): Promise<MovieDetails> {
  const movie = await requestTmdb<TmdbMovie>(`/movie/${tmdbId}`, {});

  return {
    ...toMovieSummary(movie),
    runtime: movie.runtime ?? null,
    genres: (movie.genres ?? []).map((genre) => genre.name),
  };
}
