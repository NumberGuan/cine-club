import type { MovieSummary } from '../types';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  movies: MovieSummary[];
  onSelect: (movieId: number) => void;
}

export function MovieGrid({ movies, onSelect }: MovieGridProps) {
  return (
    <ul className="movie-grid" aria-label="Resultados de películas">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} onSelect={onSelect} />
      ))}
    </ul>
  );
}
