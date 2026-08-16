import type { Review } from '../types';

interface ReviewListProps {
  reviews: Review[];
  deletingReviewId: number | null;
  onDelete: (reviewId: number) => void;
}

export function ReviewList({
  reviews,
  deletingReviewId,
  onDelete,
}: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="review-empty">
        Todavía no hay reseñas. Sé la primera persona en compartir qué te pareció.
      </p>
    );
  }

  return (
    <ol className="review-list" aria-label="Reseñas de la película">
      {reviews.map((review) => (
        <li className="review-item" key={review.id}>
          <article>
            <header className="review-header">
              <div>
                <h3>{review.author}</h3>
              </div>
              <span
                className="review-rating"
                aria-label={`Puntaje: ${review.score} de 5`}
              >
                <span aria-hidden="true">★</span> {review.score}/5
              </span>
            </header>
            <p>{review.comment}</p>
            <button
              className="button button-text review-delete"
              type="button"
              onClick={() => onDelete(review.id)}
              disabled={deletingReviewId === review.id}
            >
              {deletingReviewId === review.id ? 'Eliminando…' : 'Eliminar reseña'}
            </button>
          </article>
        </li>
      ))}
    </ol>
  );
}
