import type { FormEvent, RefObject } from 'react';

interface SearchBarProps {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function SearchBar({
  inputRef,
  value,
  loading,
  onChange,
  onSubmit,
}: SearchBarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loading && value.trim()) onSubmit();
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <label htmlFor="movie-search">Buscá una película</label>
      <div className="search-controls">
        <div className="search-input-wrap">
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            ref={inputRef}
            id="movie-search"
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Ej. El padrino, Parásitos…"
            maxLength={120}
            autoComplete="off"
            enterKeyHint="search"
            disabled={loading}
          />
        </div>
        <button
          className="button button-primary search-submit"
          type="submit"
          disabled={loading || !value.trim()}
        >
          {loading ? 'Buscando…' : 'Buscar'}
        </button>
      </div>
    </form>
  );
}
