import { useEffect, useState } from 'react';

interface PosterProps {
  path: string | null;
  title: string;
  eager?: boolean;
}

function posterUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `https://image.tmdb.org/t/p/w500${path}`;
}

export function Poster({ path, title, eager = false }: PosterProps) {
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setHasFailed(false);
  }, [path]);

  if (!path || hasFailed) {
    return (
      <div className="poster poster-placeholder" role="img" aria-label={`Poster no disponible de ${title}`}>
        <span className="poster-placeholder-mark" aria-hidden="true">
          ✦
        </span>
        <span>Poster no disponible :(</span>
      </div>
    );
  }

  return (
    <div className="poster">
      <img
        src={posterUrl(path)}
        alt={`Poster de ${title}`}
        loading={eager ? 'eager' : 'lazy'}
        onError={() => setHasFailed(true)}
      />
    </div>
  );
}
