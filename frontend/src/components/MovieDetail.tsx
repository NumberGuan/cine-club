import { useState } from 'react';
import type { Movie, ReviewDraft } from '../types';
import { Poster } from './Poster';
import { ReviewForm } from './ReviewForm';
import { ReviewList } from './ReviewList';

interface MovieDetailProps {
  movie: Movie;
  onBack: () => void;
  onCreateReview: (draft: ReviewDraft) => Promise<void>;
  onDeleteReview: (reviewId: number) => Promise<void>;
}

function formatRuntime(runtime: number | null): string {
  if (!runtime) return 'Duración no disponible';
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  return hours ? `${hours} h ${minutes} min` : `${minutes} min`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'No pudimos eliminar la reseña. Intentá nuevamente.';
}

export function MovieDetail({
  movie,
  onBack,
  onCreateReview,
  onDeleteReview,
}: MovieDetailProps) {
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const hasReviews = movie.reviews.length > 0;

  async function handleDeleteReview(reviewId: number) {
    if (deletingReviewId !== null) return;
    setDeleteError('');
    setDeletingReviewId(reviewId);

    try {
      await onDeleteReview(reviewId);
    } catch (error) {
      setDeleteError(errorMessage(error));
    } finally {
      setDeletingReviewId(null);
    }
  }

  return (
    <article className="movie-detail" aria-labelledby="movie-detail-title">
      <button className="button button-back" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span> Volver a resultados
      </button>

      <div className="detail-hero">
        <Poster path={movie.posterPath} title={movie.title} eager />

        <div className="detail-copy">
          <p className="section-kicker">Ficha de película</p>
          <h1 id="movie-detail-title">{movie.title}</h1>
          <div className="detail-meta" aria-label="Datos de la película">
            {movie.year && <span>{movie.year}</span>}
            <span>{formatRuntime(movie.runtime)}</span>
            {movie.genres.length > 0 && <span>{movie.genres.join(' · ')}</span>}
          </div>
          <p className="detail-overview">
            {movie.overview || 'Esta película todavía no tiene sinopsis disponible.'}
          </p>

          <div className="rating-summary" aria-label="Promedio de reseñas">
            <div className="rating-score">
              <span className="rating-star" aria-hidden="true">
                ★
              </span>
              <strong>{hasReviews ? movie.avgScore.toFixed(1) : '—'}</strong>
              <span className="rating-out-of">/ 5</span>
            </div>
            <span>
              {hasReviews
                ? `${movie.reviews.length} ${movie.reviews.length === 1 ? 'reseña' : 'reseñas'}`
                : 'Sin reseñas todavía'}
            </span>
          </div>
        </div>
      </div>

      <section className="reviews-section" aria-labelledby="reviews-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">La conversación</p>
            <h2 id="reviews-title">Reseñas</h2>
          </div>
          <span className="section-count">{movie.reviews.length}</span>
        </div>

        {deleteError && (
          <p className="form-message form-message-error" role="alert">
            {deleteError}
          </p>
        )}

        <ReviewList
          reviews={movie.reviews}
          deletingReviewId={deletingReviewId}
          onDelete={handleDeleteReview}
        />
        <ReviewForm onSubmit={onCreateReview} />
      </section>
    </article>
  );
}
