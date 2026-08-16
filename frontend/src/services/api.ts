import type { Movie, MovieSummary, Review, ReviewDraft } from '../types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(
  /\/$/,
  '',
);
const API_PREFIX = '/api';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null
    ? (value as ApiRecord)
    : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeMovieSummary(value: unknown): MovieSummary {
  const movie = asRecord(value);

  return {
    id: Number(movie.id),
    title: asString(movie.title, 'Película sin título'),
    year: asNullableNumber(movie.year),
    posterPath: typeof movie.posterPath === 'string' ? movie.posterPath : null,
    overview: asString(movie.overview),
    avgScore: asNullableNumber(movie.avgScore),
  };
}

function normalizeReview(value: unknown): Review {
  const review = asRecord(value);
  const createdAt =
    typeof review.createdAt === 'string' ? review.createdAt : null;

  return {
    id: Number(review.id),
    tmdbId: Number(review.tmdbId),
    author: asString(review.author, 'Anónimo'),
    score: asNullableNumber(review.score) ?? 0,
    comment: asString(review.comment),
    ...(createdAt ? { createdAt } : {}),
  };
}

function normalizeMovie(value: unknown): Movie {
  const movie = asRecord(value);
  const reviews = Array.isArray(movie.reviews)
    ? movie.reviews.map(normalizeReview)
    : [];
  const avgScore = asNullableNumber(movie.avgScore);

  return {
    ...normalizeMovieSummary(movie),
    runtime: asNullableNumber(movie.runtime),
    genres: Array.isArray(movie.genres)
      ? movie.genres.filter((genre): genre is string => typeof genre === 'string')
      : [],
    reviews,
    avgScore:
      avgScore ??
      (reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.score, 0) /
          reviews.length
        : null),
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${API_PREFIX}${path}`, {
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
      asString(body.message) ||
      asString(body.error) ||
      (typeof payload === 'string' ? payload : '') ||
      'Ocurrió un error inesperado.';
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export async function searchMovies(query: string): Promise<MovieSummary[]> {
  const payload = await request<unknown>(
    `/movies/search?q=${encodeURIComponent(query.trim())}`,
  );
  const body = asRecord(payload);
  const movies = Array.isArray(payload)
    ? payload
    : Array.isArray(body.movies)
      ? body.movies
      : [];

  return movies.map(normalizeMovieSummary);
}

export async function getMovie(movieId: number): Promise<Movie> {
  const payload = await request<unknown>(`/movies/${movieId}`);
  const body = asRecord(payload);
  return normalizeMovie(body.movie || payload);
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
  return normalizeReview(body.review || payload);
}

export async function deleteReview(reviewId: number): Promise<void> {
  await request<unknown>(`/reviews/${reviewId}`, { method: 'DELETE' });
}
