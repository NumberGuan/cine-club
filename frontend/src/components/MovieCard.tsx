import type { MovieSummary } from '../types';
import { Poster } from './Poster';

interface MovieCardProps {
  movie: MovieSummary;
  onSelect: (movieId: number) => void;
}

function releaseYear(year: number | null): string {
  return year ? String(year) : 'Año desconocido';
}

export function MovieCard({ movie, onSelect }: MovieCardProps) {
  return (
    <li className="movie-grid-item">
      <button
        className="movie-card"
        type="button"
        onClick={() => onSelect(movie.id)}
        aria-label={`Ver detalles de ${movie.title}`}
      >
        <Poster path={movie.posterPath} title={movie.title} />
        <span className="movie-card-copy">
          <span className="movie-card-title">{movie.title}</span>
          <span className="movie-card-year">{releaseYear(movie.year)}</span>
        </span>
      </button>
    </li>
  );
}
