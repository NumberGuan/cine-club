import type {
  Movie,
  MovieSummary,
  Review,
  ReviewDraft,
  SearchResponse,
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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/api${path}`, {
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
    const body = payload as { error?: unknown; message?: unknown } | null;
    const message =
      (typeof body?.error === 'string' && body.error) ||
      (typeof body?.message === 'string' && body.message) ||
      'Ocurrió un error inesperado.';
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export async function searchMovies(query: string): Promise<MovieSummary[]> {
  const { movies } = await request<SearchResponse>(
    `/movies/search?q=${encodeURIComponent(query.trim())}`,
  );
  return movies;
}

export async function getTrendingMovies(): Promise<MovieSummary[]> {
  const { movies } = await request<SearchResponse>('/movies/featured/trending');
  return movies;
}

export function getMovie(movieId: number): Promise<Movie> {
  return request<Movie>(`/movies/${movieId}`);
}

export function createReview(
  movieId: number,
  draft: ReviewDraft,
): Promise<Review> {
  return request<Review>(`/movies/${movieId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(draft),
  });
}

export async function deleteReview(reviewId: number): Promise<void> {
  await request<null>(`/reviews/${reviewId}`, { method: 'DELETE' });
}
