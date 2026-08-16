import { Router } from "express";
import { getAverageScore } from "../data/reviews.js";
import { searchMovies } from "../services/tmdb.js";

export const moviesRouter = Router();

moviesRouter.get("/search", async (request, response, next) => {
  const rawQuery = request.query.q;
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";

  if (!query) {
    response.status(400).json({ error: "El parámetro q es obligatorio." });
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
