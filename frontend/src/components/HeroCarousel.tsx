import { useEffect, useState, useRef } from 'react';
import type { RefObject } from 'react';
import type { MovieSummary } from '../types';
import { SearchBar } from './SearchBar';

interface HeroCarouselProps {
  searchInputRef: RefObject<HTMLInputElement | null>;
  query: string;
  isSearching: boolean;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  trendingMovies: MovieSummary[];
  onSelectMovie: (movieId: number) => void;
}

function backdropUrl(backdropPath?: string | null, posterPath?: string | null): string {
  if (backdropPath) {
    return `https://image.tmdb.org/t/p/w1280${backdropPath}`;
  }
  if (posterPath) {
    return `https://image.tmdb.org/t/p/w780${posterPath}`;
  }
  return '';
}

function posterThumbnailUrl(posterPath?: string | null): string {
  if (!posterPath) return '';
  return `https://image.tmdb.org/t/p/w342${posterPath}`;
}

export function HeroCarousel({
  searchInputRef,
  query,
  isSearching,
  onQueryChange,
  onSearch,
  trendingMovies,
  onSelectMovie,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const hasMovies = trendingMovies && trendingMovies.length > 0;
  const activeMovie: MovieSummary | undefined = hasMovies
    ? trendingMovies[currentIndex % trendingMovies.length]
    : undefined;

  // Auto-advance carousel every 6 seconds when not paused
  useEffect(() => {
    if (!hasMovies || isPaused) return;

    timerRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingMovies.length);
    }, 6000);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [hasMovies, isPaused, trendingMovies.length]);

  function handlePrev() {
    if (!hasMovies) return;
    setCurrentIndex((prev) => (prev - 1 + trendingMovies.length) % trendingMovies.length);
  }

  function handleNext() {
    if (!hasMovies) return;
    setCurrentIndex((prev) => (prev + 1) % trendingMovies.length);
  }

  const bgImage = activeMovie
    ? backdropUrl(activeMovie.backdropPath, activeMovie.posterPath)
    : '';

  return (
    <section
      className="hero-wrapper"
      aria-labelledby="search-title"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Background with movie backdrop and vertical opacity gradient */}
      {bgImage && (
        <div
          className="hero-backdrop"
          style={{ backgroundImage: `url(${bgImage})` }}
          aria-hidden="true"
        >
          <div className="hero-backdrop-gradient" />
        </div>
      )}

      <div className="hero-grid">
        {/* Left Column: Search Hero compacted & aligned left */}
        <div className="hero-left">
          <div className="kicker-badge kicker-badge-yellow">
            <span>✦</span> Buscador de Cine
          </div>
          <h1 id="search-title" className="hero-title">
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
            onChange={onQueryChange}
            onSubmit={onSearch}
          />
        </div>

        {/* Right Column: Featured Trending Movie Card & Carousel */}
        {activeMovie && (
          <aside
            className="hero-featured-card"
            aria-label="Película recomendada en cartelera"
          >
            <div className="featured-card-header">
              <div className="kicker-badge kicker-badge-coral">
                <span>★</span> Trending TMDB
              </div>
              <div className="featured-pagination" aria-label="Controles del carrusel">
                <button
                  type="button"
                  className="carousel-btn"
                  onClick={handlePrev}
                  aria-label="Película anterior"
                >
                  ←
                </button>
                <span className="carousel-counter">
                  {currentIndex + 1} / {trendingMovies.length}
                </span>
                <button
                  type="button"
                  className="carousel-btn"
                  onClick={handleNext}
                  aria-label="Siguiente película"
                >
                  →
                </button>
              </div>
            </div>

            <div className="featured-card-body">
              {activeMovie.posterPath && (
                <div className="featured-poster-thumb">
                  <img
                    src={posterThumbnailUrl(activeMovie.posterPath)}
                    alt={`Afiche de ${activeMovie.title}`}
                    loading="lazy"
                  />
                </div>
              )}

              <div className="featured-info">
                <div className="featured-meta">
                  {activeMovie.year && (
                    <span className="featured-tag">{activeMovie.year}</span>
                  )}
                  <span className="featured-tag featured-score">
                    {activeMovie.avgScore > 0
                      ? `★ ${activeMovie.avgScore.toFixed(1)}`
                      : 'Sin reseñas'}
                  </span>
                </div>
                <h3 className="featured-title">{activeMovie.title}</h3>
                <p className="featured-overview">
                  {activeMovie.overview
                    ? activeMovie.overview.length > 180
                      ? `${activeMovie.overview.slice(0, 180).trim()}…`
                      : activeMovie.overview
                    : 'Sin sinopsis disponible.'}
                </p>
              </div>
            </div>

            <div className="featured-card-footer">
              <button
                type="button"
                className="button button-primary featured-cta"
                onClick={() => onSelectMovie(activeMovie.id)}
                aria-label={`Ver reseñas de ${activeMovie.title}`}
              >
                Ver reseñas <span aria-hidden="true">→</span>
              </button>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
