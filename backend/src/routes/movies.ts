import { Router } from "express";
import { getAverageScore, listReviews } from "../data/reviews.js";
import { getMovieDetails, searchMovies } from "../services/tmdb.js";

export const moviesRouter = Router();

moviesRouter.get("/search", async (request, response, next) => {
  const rawQuery = request.query.q;
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";

  if (!query) {
    response.status(400).json({ error: "El parámetro q es obligatorio." });
    return;
  }

  if (query.length > 120) {
    response.status(400).json({ error: "La búsqueda admite hasta 120 caracteres." });
    return;
  }

  try {
    const movies = await searchMovies(query);
    response.json({
      movies: movies.map((movie) => ({
        ...movie,
        avgScore: getAverageScore(movie.id),
      })),
    });
  } catch (error) {
    next(error);
  }
});

moviesRouter.get("/:tmdbId", async (request, response, next) => {
  const tmdbId = Number(request.params.tmdbId);

  if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0) {
    response.status(400).json({ error: "tmdbId debe ser un número positivo." });
    return;
  }

  try {
    const movie = await getMovieDetails(tmdbId);
    const reviews = listReviews(tmdbId).map(({ id, tmdbId: reviewMovieId, author, score, comment }) => ({
      id,
      tmdbId: reviewMovieId,
      author,
      score,
      comment,
    }));

    response.json({
      ...movie,
      reviews,
      avgScore: getAverageScore(tmdbId),
    });
  } catch (error) {
    next(error);
  }
});
