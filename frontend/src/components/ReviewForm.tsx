import { useState } from 'react';
import type { FormEvent } from 'react';
import type { ReviewDraft } from '../types';

interface ReviewFormProps {
  onSubmit: (draft: ReviewDraft) => Promise<void>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'No pudimos guardar la reseña. Intentá nuevamente.';
}

export function ReviewForm({ onSubmit }: ReviewFormProps) {
  const [author, setAuthor] = useState('');
  const [score, setScore] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedAuthor = author.trim();
    const trimmedComment = comment.trim();
    const numericScore = Number(score);

    if (!trimmedAuthor || !trimmedComment || !score) {
      setError('Completá tu nombre, un puntaje y tu comentario.');
      return;
    }

    if (!Number.isInteger(numericScore) || numericScore < 1 || numericScore > 5) {
      setError('El puntaje debe estar entre 1 y 5.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit({
        author: trimmedAuthor,
        score: numericScore,
        comment: trimmedComment,
      });
      setAuthor('');
      setScore('');
      setComment('');
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit} noValidate>
      <div className="form-heading">
        <div>
          <p className="section-kicker">Tu turno</p>
          <h3>Dejá tu reseña</h3>
        </div>
        <span className="required-note">Todos los campos son obligatorios</span>
      </div>

      <div className="form-fields">
        <div className="form-field">
          <label htmlFor="review-author">Tu nombre</label>
          <input
            id="review-author"
            type="text"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="¿Cómo te llamás?"
            maxLength={80}
            autoComplete="name"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-field">
          <label htmlFor="review-score">Puntaje</label>
          <select
            id="review-score"
            value={score}
            onChange={(event) => setScore(event.target.value)}
            disabled={isSubmitting}
          >
            <option value="">Elegí del 1 al 5</option>
            <option value="5">5 · Imprescindible</option>
            <option value="4">4 · Muy buena</option>
            <option value="3">3 · Está bien</option>
            <option value="2">2 · Irregular</option>
            <option value="1">1 · No me gustó</option>
          </select>
        </div>

        <div className="form-field form-field-wide">
          <label htmlFor="review-comment">Tu comentario</label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="¿Qué te dejó esta película?"
            rows={4}
            maxLength={1000}
            disabled={isSubmitting}
          />
          <span className="character-count">{comment.length}/1000</span>
        </div>
      </div>

      {error && (
        <p className="form-message form-message-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button className="button button-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Publicar reseña'}
        </button>
      </div>
    </form>
  );
}
