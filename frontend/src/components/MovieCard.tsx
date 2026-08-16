import type { MovieSummary } from '../types';
import { Poster } from './Poster';

interface MovieCardProps {
  movie: MovieSummary;
  onSelect: (movieId: number) => void;
}

function releaseYear(date: string | null): string {
  return date?.slice(0, 4) || 'Año desconocido';
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
          <span className="movie-card-year">{releaseYear(movie.releaseDate)}</span>
        </span>
      </button>
    </li>
  );
}
