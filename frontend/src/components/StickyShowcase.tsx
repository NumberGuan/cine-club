import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

interface ShowcasePillar {
  number: string;
  tag: string;
  tagColor: 'yellow' | 'mint' | 'coral';
  title: string;
  description: string;
  stamp: string;
}

const PILLARS: ShowcasePillar[] = [
  {
    number: '01',
    tag: 'Backend',
    tagColor: 'yellow',
    title: 'Node.js + Express',
    description:
      'Conectamos con la base de datos de TMDB a través de nuestro backend Express para que encuentres desde clásicos de autor hasta estrenos contemporáneos.',
    stamp: 'TMDB API',
  },
  {
    number: '02',
    tag: 'Frontend',
    tagColor: 'mint',
    title: 'React',
    description:
      'Afiches de alta fidelidad, año de lanzamiento, géneros curados, duración exacta y el promedio en tiempo real de toda la comunidad cinéfila.',
    stamp: 'CINEMA SCORE · 5★',
  },
  {
    number: '03',
    tag: 'Evaluación',
    tagColor: 'coral',
    title: 'Tu crítica cuenta',
    description:
      'Publicá y gestioná reseñas almacenadas en memoria con puntajes del 1 al 5. Sin cuentas innecesarias, directo a la conversación.',
    stamp: 'CRÍTICA LIBRE · IN MEMORY',
  },
];

export function StickyShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Transformaciones suaves y reversibles aceleradas por GPU
  const rotateX = useTransform(scrollYProgress, [0, 0.4, 0.8], [10, 0, -6]);
  const scale = useTransform(scrollYProgress, [0, 0.4, 0.8], [0.96, 1, 0.98]);
  const y = useTransform(scrollYProgress, [0, 0.4, 0.8], [20, 0, -15]);

  return (
    <section
      ref={containerRef}
      className="sticky-showcase-wrapper"
      aria-label="Presentación del club"
    >
      <div className="kicker-badge kicker-badge-yellow">
        <span>✦</span> Arquitectura
      </div>

      <motion.div
        className="showcase-section"
        style={{
          rotateX,
          scale,
          y,
          transformPerspective: 1200,
        }}
      >
        <div className="showcase-header">
          <div className="showcase-dots" aria-hidden="true">
            <span className="showcase-dot red" />
            <span className="showcase-dot yellow" />
            <span className="showcase-dot green" />
          </div>
          <span className="showcase-title-bar">
            Desarrollo de Aplicaciones Web Full Stack · CineClub
          </span>
          <span className="showcase-status-badge" aria-hidden="true">
            ● EN VIVO
          </span>
        </div>

        <div className="showcase-grid">
          {PILLARS.map((pillar) => (
            <article className="showcase-card" key={pillar.number}>
              <div className="showcase-card-top">
                <span className="showcase-card-kicker">
                  {pillar.tag}
                </span>
                <span className="showcase-card-num" aria-hidden="true">
                  {pillar.number}
                </span>
              </div>
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
              <div className="showcase-card-footer">
                <span className="ticket-stamp">{pillar.stamp}</span>
              </div>
            </article>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
