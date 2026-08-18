import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { HeroCarousel } from './components/HeroCarousel';
import { MovieDetail } from './components/MovieDetail';
import { MovieGrid } from './components/MovieGrid';
import { SearchBar } from './components/SearchBar';
import { StickyShowcase } from './components/StickyShowcase';
import {
  createReview,
  deleteReview,
  getMovie,
  getTrendingMovies,
  searchMovies,
} from './services/api';
import type { Movie, MovieSummary, Review, ReviewDraft } from './types';

type AppView = 'home' | 'search' | 'detail';

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
  const searchViewInputRef = useRef<HTMLInputElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreSearchFocus = useRef(false);
  const reviewMutationInFlight = useRef(false);

  // Navegación principal manejada con useState según requisitos del parcial
  const [view, setView] = useState<AppView>('home');
  const [previousView, setPreviousView] = useState<'home' | 'search'>('home');
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<MovieSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoadingMovie, setIsLoadingMovie] = useState(false);
  const [movieError, setMovieError] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');

  // Carga inicial de películas trending para el carrusel
  useEffect(() => {
    let isMounted = true;
    getTrendingMovies()
      .then((trending) => {
        if (isMounted) {
          setTrendingMovies(trending);
        }
      })
      .catch(() => {
        // Fallback silencioso si no hay conexión temporal con TMDB
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Manejo accesible del foco al cambiar de vista
  useEffect(() => {
    if (view === 'detail') {
      backButtonRef.current?.focus();
    } else if (shouldRestoreSearchFocus.current) {
      if (view === 'search') {
        searchViewInputRef.current?.focus();
      } else {
        searchInputRef.current?.focus();
      }
      shouldRestoreSearchFocus.current = false;
    }
  }, [view, isLoadingMovie]);

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

  // Ejecuta la búsqueda y cambia a la vista de resultados ('search')
  async function handleSearch(searchQuery?: string) {
    const targetQuery = (searchQuery ?? query).trim();
    if (!targetQuery || isSearching) return;

    setPreviousView('home');
    setView('search');
    setSelectedMovieId(null);
    setMovie(null);
    setMovieError('');
    setReviewNotice('');
    setSearchError('');
    setIsSearching(true);

    try {
      setMovies(await searchMovies(targetQuery));
    } catch (error) {
      setMovies([]);
      setSearchError(
        messageFor(error, 'No pudimos buscar películas. Intentá nuevamente.'),
      );
    } finally {
      setIsSearching(false);
    }
  }

  // Carga el detalle de una película y cambia a la vista de detalle ('detail')
  async function loadMovie(movieId: number, originView?: 'home' | 'search') {
    const origin = originView ?? (view === 'search' ? 'search' : 'home');
    setPreviousView(origin);
    const requestId = activeMovieRequest.current + 1;
    activeMovieRequest.current = requestId;
    setSelectedMovieId(movieId);
    setView('detail');
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

  // Retorna a la vista anterior preservando el foco
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
    setView(previousView);
  }

  function handleGoHome() {
    activeMovieRequest.current += 1;
    setSelectedMovieId(null);
    setMovie(null);
    setMovieError('');
    setReviewNotice('');
    setIsLoadingMovie(false);
    setView('home');
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
    <LoadingState label="Cargando la ficha técnica…" />
  ) : movieError ? (
    <ErrorState
      message={movieError}
      onRetry={() => selectedMovieId !== null && loadMovie(selectedMovieId, previousView)}
    />
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
          <button
            type="button"
            className="brand"
            onClick={handleGoHome}
            aria-label="CineClub - Ir al inicio"
          >
            <span className="brand-mark" aria-hidden="true">
              CC
            </span>
            <span className="brand-text">CineClub</span>
          </button>
          <div className="header-tagline">
            <span>✦</span> Historias para compartir
          </div>
        </div>
      </header>

      <main className="container main-content">
        {/* VISTA 1: HOME (Hero con carrusel + Catálogo Inicial + Metodología al final) */}
        {view === 'home' && (
          <>
            <HeroCarousel
              searchInputRef={searchInputRef}
              query={query}
              isSearching={isSearching}
              onQueryChange={setQuery}
              onSearch={() => handleSearch()}
              trendingMovies={trendingMovies}
              onSelectMovie={(id) => loadMovie(id, 'home')}
            />

            {/* Sección Catálogo / Empezá por una búsqueda (subida inmediatamente después del Hero) */}
            <section className="results-section" aria-labelledby="catalog-home-title">
              <div className="section-heading results-heading">
                <div>
                  <div className="kicker-badge kicker-badge-mint">
                    <span>✦</span> Catálogo TMDB
                  </div>
                  <h2 id="catalog-home-title">Películas a tu manera</h2>
                </div>
              </div>

              <EmptyState searched={false} />
            </section>

            {/* Sección Metodología CineClub (movida hacia abajo, antes del footer) */}
            <StickyShowcase />
          </>
        )}

        {/* VISTA 2: RESULTADOS DE BÚSQUEDA (Dedicada con navegación useState) */}
        {view === 'search' && (
          <div className="search-view" aria-label="Vista de resultados de búsqueda">
            <div className="search-view-header">
              <div className="search-view-nav">
                <button
                  type="button"
                  className="button button-back"
                  onClick={handleGoHome}
                >
                  <span aria-hidden="true">←</span> Volver al inicio
                </button>
                <div className="kicker-badge kicker-badge-yellow">
                  <span>✦</span> Buscador Activo
                </div>
              </div>

              <div className="search-view-bar">
                <SearchBar
                  inputRef={searchViewInputRef}
                  value={query}
                  loading={isSearching}
                  onChange={setQuery}
                  onSubmit={() => handleSearch()}
                />
              </div>
            </div>

            <section className="results-section" aria-labelledby="search-results-title">
              <div className="section-heading results-heading">
                <div>
                  <div className="kicker-badge kicker-badge-mint">
                    <span>✦</span> Resultados para "{query}"
                  </div>
                  <h2 id="search-results-title">Catálogo encontrado</h2>
                </div>
                {movies.length > 0 && (
                  <span className="section-count">{movies.length}</span>
                )}
              </div>

              {isSearching ? (
                <LoadingState label="Buscando en el catálogo de TMDB…" />
              ) : searchError ? (
                <ErrorState message={searchError} onRetry={() => handleSearch()} />
              ) : movies.length > 0 ? (
                <MovieGrid movies={movies} onSelect={(id) => loadMovie(id, 'search')} />
              ) : (
                <EmptyState searched={true} />
              )}
            </section>
          </div>
        )}

        {/* VISTA 3: DETALLE DE PELÍCULA Y RESEÑAS */}
        {view === 'detail' && (
          <section className="detail-section" aria-label="Detalle de película">
            {(isLoadingMovie || movieError) && (
              <button
                ref={backButtonRef}
                className="button button-back"
                type="button"
                onClick={handleBack}
              >
                <span aria-hidden="true">←</span>{' '}
                {previousView === 'search' ? 'Volver a resultados' : 'Volver al inicio'}
              </button>
            )}
            {detailContent}
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <span className="footer-brand">CineClubsito</span>
          <span>Datos provistos por TMDB · Reseñas almacenadas en memoria</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
