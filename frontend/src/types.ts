export interface MovieSummary {
  id: number;
  title: string;
  year: number | null;
  overview: string;
  posterPath: string | null;
  avgScore: number | null;
}

export interface Review {
  id: number;
  tmdbId: number;
  author: string;
  score: number;
  comment: string;
  createdAt?: string | null;
}

export interface Movie extends MovieSummary {
  runtime: number | null;
  genres: string[];
  reviews: Review[];
}

export interface ReviewDraft {
  author: string;
  score: number;
  comment: string;
}

export interface SearchResponse {
  movies: MovieSummary[];
}

export interface MovieResponse {
  movie: Movie;
}

export interface ReviewResponse {
  review: Review;
}
