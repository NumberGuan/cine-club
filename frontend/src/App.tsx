import { useState } from 'react';
import type { ReactNode } from 'react';
import { MovieDetail } from './components/MovieDetail';
import { MovieGrid } from './components/MovieGrid';
import { SearchBar } from './components/SearchBar';
import { createReview, deleteReview, getMovie, searchMovies } from './services/api';
import type { Movie, MovieSummary, ReviewDraft } from './types';

function messageFor(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
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
        ◌
      </span>
      <h2>{searched ? 'No encontramos esa película' : 'Empezá por una búsqueda'}</h2>
      <p>
        {searched
          ? 'Probá con otro título, una palabra más corta o el nombre original.'
          : 'Explorá el catálogo de TMDB y encontrá una historia para esta noche.'}
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
      <button className="button button-secondary" type="button" onClick={onRetry}>
        Intentar de nuevo
      </button>
    </div>
  );
}

function App() {
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
    setSelectedMovieId(movieId);
    setMovie(null);
    setMovieError('');
    setReviewNotice('');
    setIsLoadingMovie(true);

    try {
      setMovie(await getMovie(movieId));
    } catch (error) {
      setMovieError(
        messageFor(error, 'No pudimos cargar esta película. Intentá nuevamente.'),
      );
    } finally {
      setIsLoadingMovie(false);
    }
  }

  function handleBack() {
    setSelectedMovieId(null);
    setMovie(null);
    setMovieError('');
    setReviewNotice('');
  }

  async function refreshMovie(movieId: number) {
    setMovie(await getMovie(movieId));
  }

  async function handleCreateReview(draft: ReviewDraft) {
    if (selectedMovieId === null) return;
    await createReview(selectedMovieId, draft);
    await refreshMovie(selectedMovieId);
    setReviewNotice('Tu reseña se publicó correctamente.');
  }

  async function handleDeleteReview(reviewId: number) {
    if (selectedMovieId === null) return;
    await deleteReview(reviewId);
    await refreshMovie(selectedMovieId);
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
        movie={movie}
        onBack={handleBack}
        onCreateReview={handleCreateReview}
        onDeleteReview={handleDeleteReview}
      />
    </>
  ) : null;

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <p className="brand" aria-label="CineClub">
            <span className="brand-mark" aria-hidden="true">
              C
            </span>
            CineClub
          </p>
          <p className="header-note">Historias para compartir</p>
        </div>
      </header>

      <main className="container main-content">
        {selectedMovieId === null ? (
          <>
            <section className="search-hero" aria-labelledby="search-title">
              <p className="eyebrow">Tu próxima película</p>
              <h1 id="search-title">Buscá algo que<br />
                <em>te mueva.</em>
              </h1>
              <p className="hero-description">
                Explorá películas, conocé sus historias y dejá una reseña para la próxima persona cinéfila.
              </p>
              <SearchBar
                value={query}
                loading={isSearching}
                onChange={setQuery}
                onSubmit={handleSearch}
              />
            </section>

            <section className="results-section" aria-labelledby="results-title">
              <div className="section-heading results-heading">
                <div>
                  <p className="section-kicker">Explorar</p>
                  <h2 id="results-title">
                    {hasSearched ? 'Resultados' : 'Películas a tu manera'}
                  </h2>
                </div>
                {movies.length > 0 && <span className="section-count">{movies.length}</span>}
              </div>

              {isSearching ? (
                <LoadingState label="Buscando en el catálogo…" />
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
              <button className="button button-back" type="button" onClick={handleBack}>
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
          <span>Datos de películas provistos por TMDB</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
