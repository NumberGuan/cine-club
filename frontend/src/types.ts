export interface MovieSummary {
  id: number;
  title: string;
  year: number | null;
  overview: string;
  posterPath: string | null;
  backdropPath?: string | null;
  avgScore: number;
}

export interface Review {
  id: number;
  tmdbId: number;
  author: string;
  score: number;
  comment: string;
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
