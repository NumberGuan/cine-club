import { Router } from "express";
import { createReview, deleteReview } from "../data/reviews.js";

export const reviewsRouter = Router();

reviewsRouter.post("/movies/:tmdbId/reviews", (request, response) => {
  const tmdbId = Number(request.params.tmdbId);
  const body = request.body as Record<string, unknown> | undefined;
  const author = typeof body?.author === "string" ? body.author.trim() : "";
  const comment = typeof body?.comment === "string" ? body.comment.trim() : "";
  const score = body?.score;

  if (
    !Number.isSafeInteger(tmdbId) ||
    tmdbId <= 0 ||
    !author ||
    author.length > 80 ||
    !comment ||
    comment.length > 1_000 ||
    typeof score !== "number" ||
    !Number.isFinite(score) ||
    !Number.isInteger(score) ||
    score < 1 ||
    score > 5
  ) {
    response.status(400).json({
      error:
        "tmdbId, author (máximo 80 caracteres), comment (máximo 1000) y un score entero entre 1 y 5 son obligatorios.",
    });
    return;
  }

  const review = createReview({ tmdbId, author, score, comment });
  response.status(201).json(review);
});

reviewsRouter.delete("/reviews/:reviewId", (request, response) => {
  const reviewId = Number(request.params.reviewId);

  if (!Number.isSafeInteger(reviewId) || reviewId <= 0 || !deleteReview(reviewId)) {
    response.status(404).json({ error: "La reseña no existe." });
    return;
  }

  response.status(204).send();
});
