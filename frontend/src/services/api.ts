import type {
  Movie,
  MovieSummary,
  Review,
  ReviewDraft,
} from '../types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(
  /\/$/,
  '',
);

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue {
  return typeof value === 'object' && value !== null
    ? (value as RecordValue)
    : {};
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function nullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeMovieSummary(value: unknown): MovieSummary {
  const movie = asRecord(value);

  return {
    id: Number(movie.id),
    title: stringValue(movie.title || movie.name, 'Película sin título'),
    overview: stringValue(movie.overview || movie.description),
    posterPath: nullableString(movie.posterPath || movie.poster_path),
    releaseDate: nullableString(movie.releaseDate || movie.release_date),
  };
}

function normalizeReview(value: unknown): Review {
  const review = asRecord(value);

  return {
    id: Number(review.id),
    movieId: Number(review.movieId || review.movie_id),
    name: stringValue(review.name || review.author, 'Anónimo'),
    rating: nullableNumber(review.rating) ?? 0,
    comment: stringValue(review.comment || review.text),
    createdAt: stringValue(review.createdAt || review.created_at),
  };
}

function normalizeMovie(value: unknown): Movie {
  const movie = asRecord(value);
  const reviews = Array.isArray(movie.reviews)
    ? movie.reviews.map(normalizeReview)
    : [];
  const averageRating = nullableNumber(
    movie.averageRating || movie.average_rating,
  );

  return {
    ...normalizeMovieSummary(movie),
    runtime: nullableNumber(movie.runtime),
    genres: Array.isArray(movie.genres)
      ? movie.genres.map((genre) =>
          typeof genre === 'string'
            ? genre
            : stringValue(asRecord(genre).name),
        )
      : [],
    voteAverage: nullableNumber(movie.voteAverage || movie.vote_average),
    reviews,
    averageRating:
      averageRating ??
      (reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : null),
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
        ...options?.headers,
      },
    });
  } catch {
    throw new ApiError(
      'No pudimos conectarnos con CineClub. Revisá que el servidor esté encendido.',
    );
  }

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const body = asRecord(payload);
    const message =
      stringValue(body.message) ||
      stringValue(body.error) ||
      (typeof payload === 'string' ? payload : '') ||
      'Ocurrió un error inesperado.';
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export async function searchMovies(query: string): Promise<MovieSummary[]> {
  const payload = await request<unknown>(
    `/movies/search?query=${encodeURIComponent(query.trim())}`,
  );
  const body = asRecord(payload);
  const movies = Array.isArray(payload)
    ? payload
    : Array.isArray(body.movies)
      ? body.movies
      : Array.isArray(body.results)
        ? body.results
        : [];

  return movies.map(normalizeMovieSummary);
}

export async function getMovie(movieId: number): Promise<Movie> {
  const payload = await request<unknown>(`/movies/${movieId}`);
  const body = asRecord(payload);
  return normalizeMovie(body.movie || body.data || payload);
}

export async function createReview(
  movieId: number,
  draft: ReviewDraft,
): Promise<Review> {
  const payload = await request<unknown>(`/movies/${movieId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(draft),
  });
  const body = asRecord(payload);
  return normalizeReview(body.review || body.data || payload);
}

export async function deleteReview(reviewId: number): Promise<void> {
  await request<unknown>(`/reviews/${reviewId}`, { method: 'DELETE' });
}
