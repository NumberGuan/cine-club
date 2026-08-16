import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { MovieDetail } from './components/MovieDetail';
import { MovieGrid } from './components/MovieGrid';
import { SearchBar } from './components/SearchBar';
import { StickyShowcase } from './components/StickyShowcase';
import { createReview, deleteReview, getMovie, searchMovies } from './services/api';
import type { Movie, MovieSummary, Review, ReviewDraft } from './types';

function messageFor(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function withReviews(movie: Movie, reviews: Review[]): Movie {
  const avgScore = reviews.length
    ? Number(
        (reviews.reduce((total, review) => total + review.score, 0) / reviews.length).toFixed(1),
      )
    : 0;

  return { ...movie, reviews, avgScore };
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="state-card loading-state" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

function EmptyState({ searched }: { searched: boolean }) {
  return (
    <div className="state-card empty-state" role="status">
      <span className="state-mark" aria-hidden="true">
        {searched ? '✕' : '✦'}
      </span>
      <h2>{searched ? 'No encontramos esa película' : 'Empezá por una búsqueda'}</h2>
      <p>
        {searched
          ? 'Probá con otro título, una palabra más corta o el nombre original en TMDB.'
          : 'Explorá el catálogo global de películas y compartí tu propia crítica.'}
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="state-card error-state" role="alert">
      <span className="state-mark" aria-hidden="true">
        !
      </span>
      <h2>Algo salió mal</h2>
      <p>{message}</p>
      <button className="button button-danger" type="button" onClick={onRetry}>
        Intentar nuevamente
      </button>
    </div>
  );
}

function App() {
  const activeMovieRequest = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreSearchFocus = useRef(false);
  const reviewMutationInFlight = useRef(false);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoadingMovie, setIsLoadingMovie] = useState(false);
  const [movieError, setMovieError] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');

  useEffect(() => {
    if (selectedMovieId === null) {
      if (shouldRestoreSearchFocus.current) {
        searchInputRef.current?.focus();
        shouldRestoreSearchFocus.current = false;
      }
      return;
    }

    backButtonRef.current?.focus();
  }, [selectedMovieId, isLoadingMovie]);

  async function runReviewMutation<T>(mutation: () => Promise<T>): Promise<T> {
    if (reviewMutationInFlight.current) {
      throw new Error('Esperá a que termine la otra operación de reseña.');
    }

    reviewMutationInFlight.current = true;
    try {
      return await mutation();
    } finally {
      reviewMutationInFlight.current = false;
    }
  }

  async function handleSearch() {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isSearching) return;

    setSelectedMovieId(null);
    setMovie(null);
    setMovieError('');
    setReviewNotice('');
    setSearchError('');
    setHasSearched(true);
    setIsSearching(true);

    try {
      setMovies(await searchMovies(trimmedQuery));
    } catch (error) {
      setMovies([]);
      setSearchError(
        messageFor(error, 'No pudimos buscar películas. Intentá nuevamente.'),
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function loadMovie(movieId: number) {
    const requestId = activeMovieRequest.current + 1;
    activeMovieRequest.current = requestId;
    setSelectedMovieId(movieId);
    setMovie(null);
    setMovieError('');
    setReviewNotice('');
    setIsLoadingMovie(true);

    try {
      const loadedMovie = await getMovie(movieId);
      if (requestId === activeMovieRequest.current) {
        setMovie(loadedMovie);
      }
    } catch (error) {
      if (requestId === activeMovieRequest.current) {
        setMovieError(
          messageFor(error, 'No pudimos cargar esta película. Intentá nuevamente.'),
        );
      }
    } finally {
      if (requestId === activeMovieRequest.current) {
        setIsLoadingMovie(false);
      }
    }
  }

  function handleBack() {
    activeMovieRequest.current += 1;
    shouldRestoreSearchFocus.current = true;
    if (movie) {
      setMovies((currentMovies) =>
        currentMovies.map((currentMovie) =>
          currentMovie.id === movie.id
            ? { ...currentMovie, avgScore: movie.avgScore }
            : currentMovie,
        ),
      );
    }
    setSelectedMovieId(null);
    setMovie(null);
    setMovieError('');
    setReviewNotice('');
    setIsLoadingMovie(false);
  }

  async function handleCreateReview(draft: ReviewDraft) {
    if (selectedMovieId === null) return;
    const movieId = selectedMovieId;
    const movieAtStart = movie?.id === movieId ? movie : null;
    const navigationId = activeMovieRequest.current;
    const review = await runReviewMutation(() => createReview(movieId, draft));

    if (movieAtStart) {
      const reviews = movieAtStart.reviews.some(
        (currentReview) => currentReview.id === review.id,
      )
        ? movieAtStart.reviews
        : [...movieAtStart.reviews, review];
      const updatedMovie = withReviews(movieAtStart, reviews);
      setMovies((currentMovies) =>
        currentMovies.map((currentMovie) =>
          currentMovie.id === movieId
            ? { ...currentMovie, avgScore: updatedMovie.avgScore }
            : currentMovie,
        ),
      );
    }

    if (navigationId !== activeMovieRequest.current) return;

    setMovie((currentMovie) =>
      currentMovie?.id === movieId
        ? withReviews(
            currentMovie,
            currentMovie.reviews.some((currentReview) => currentReview.id === review.id)
              ? currentMovie.reviews
              : [...currentMovie.reviews, review],
          )
        : currentMovie,
    );
    setReviewNotice('Tu reseña se publicó correctamente.');
  }

  async function handleDeleteReview(reviewId: number) {
    if (selectedMovieId === null) return;
    const movieId = selectedMovieId;
    const movieAtStart = movie?.id === movieId ? movie : null;
    const navigationId = activeMovieRequest.current;
    await runReviewMutation(() => deleteReview(reviewId));

    if (movieAtStart) {
      const updatedMovie = withReviews(
        movieAtStart,
        movieAtStart.reviews.filter((review) => review.id !== reviewId),
      );
      setMovies((currentMovies) =>
        currentMovies.map((currentMovie) =>
          currentMovie.id === movieId
            ? { ...currentMovie, avgScore: updatedMovie.avgScore }
            : currentMovie,
        ),
      );
    }

    if (navigationId !== activeMovieRequest.current) return;

    setMovie((currentMovie) =>
      currentMovie?.id === movieId
        ? withReviews(
            currentMovie,
            currentMovie.reviews.filter((review) => review.id !== reviewId),
          )
        : currentMovie,
    );
    setReviewNotice('La reseña se eliminó correctamente.');
  }

  const detailContent: ReactNode = isLoadingMovie ? (
    <LoadingState label="Cargando la ficha…" />
  ) : movieError ? (
    <ErrorState message={movieError} onRetry={() => selectedMovieId !== null && loadMovie(selectedMovieId)} />
  ) : movie ? (
    <>
      {reviewNotice && (
        <p className="notification" role="status">
          {reviewNotice}
        </p>
      )}
      <MovieDetail
        backButtonRef={backButtonRef}
        movie={movie}
        onBack={handleBack}
        onCreateReview={handleCreateReview}
        onDeleteReview={handleDeleteReview}
      />
    </>
  ) : null;

  return (
    <div className="app-shell">
      <div className="top-ticker" aria-hidden="true">
        <div className="container ticker-track">
          <span>★ CINECLUB · EDICIÓN 2026</span>
          <span>BÚSQUEDA TMDB EN TIEMPO REAL</span>
          <span>RESEÑAS EN MEMORIA ★</span>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <p className="brand" aria-label="CineClub">
            <span className="brand-mark" aria-hidden="true">
              CC
            </span>
            CineClub
          </p>
          <div className="header-tagline">
            <span>✦</span> Historias para compartir
          </div>
        </div>
      </header>

      <main className="container main-content">
        {selectedMovieId === null ? (
          <>
            <section className="search-hero" aria-labelledby="search-title">
              <div className="kicker-badge kicker-badge-yellow">
                <span>✦</span> Buscador de Cine
              </div>
              <h1 id="search-title">
                Buscá algo que<br />
                <em>te mueva.</em>
              </h1>
              <p className="hero-description">
                Explorá películas del catálogo global de TMDB, conocé sus historias y compartí tu reseña con la comunidad cinéfila.
              </p>
              <SearchBar
                inputRef={searchInputRef}
                value={query}
                loading={isSearching}
                onChange={setQuery}
                onSubmit={handleSearch}
              />
            </section>

            <StickyShowcase />

            <section className="results-section" aria-labelledby="results-title">
              <div className="section-heading results-heading">
                <div>
                  <div className="kicker-badge kicker-badge-mint">
                    <span>✦</span> Catálogo TMDB
                  </div>
                  <h2 id="results-title">
                    {hasSearched ? 'Resultados' : 'Películas a tu manera'}
                  </h2>
                </div>
                {movies.length > 0 && <span className="section-count">{movies.length}</span>}
              </div>

              {isSearching ? (
                <LoadingState label="Buscando en el catálogo de TMDB…" />
              ) : searchError ? (
                <ErrorState message={searchError} onRetry={handleSearch} />
              ) : movies.length > 0 ? (
                <MovieGrid movies={movies} onSelect={loadMovie} />
              ) : (
                <EmptyState searched={hasSearched} />
              )}
            </section>
          </>
        ) : (
          <section className="detail-section" aria-label="Detalle de película">
            {(isLoadingMovie || movieError) && (
              <button
                ref={backButtonRef}
                className="button button-back"
                type="button"
                onClick={handleBack}
              >
                <span aria-hidden="true">←</span> Volver a resultados
              </button>
            )}
            {detailContent}
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <span>CineClub</span>
          <span>Datos provistos por TMDB · Reseñas almacenadas en memoria</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
