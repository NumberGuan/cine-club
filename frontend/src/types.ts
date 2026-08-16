export interface MovieSummary {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string | null;
}

export interface Review {
  id: number;
  movieId: number;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Movie extends MovieSummary {
  runtime: number | null;
  genres: string[];
  voteAverage: number | null;
  reviews: Review[];
  averageRating: number | null;
}

export interface ReviewDraft {
  name: string;
  rating: number;
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
