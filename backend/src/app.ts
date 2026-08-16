import "dotenv/config";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import morgan from "morgan";
import { moviesRouter } from "./routes/movies.js";
import { reviewsRouter } from "./routes/reviews.js";
import {
  TmdbConfigError,
  TmdbNotFoundError,
  TmdbRequestError,
} from "./services/tmdb.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/api/movies", moviesRouter);
app.use("/api", reviewsRouter);

app.use((_request, response) => {
  response.status(404).json({ error: "Ruta no encontrada." });
});

function getJsonBodyError(error: unknown): { statusCode: 400 | 413; message: string } | null {
  if (typeof error !== "object" || error === null || !("type" in error)) {
    return null;
  }

  if (error.type === "entity.parse.failed") {
    return { statusCode: 400, message: "El cuerpo JSON no es válido." };
  }

  if (error.type === "entity.too.large") {
    return { statusCode: 413, message: "El cuerpo de la solicitud es demasiado grande." };
  }

  return null;
}

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const jsonBodyError = getJsonBodyError(error);

  if (jsonBodyError) {
    response.status(jsonBodyError.statusCode).json({ error: jsonBodyError.message });
    return;
  }

  if (
    error instanceof TmdbConfigError ||
    error instanceof TmdbNotFoundError ||
    error instanceof TmdbRequestError
  ) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({ error: "Error interno del servidor." });
};

app.use(errorHandler);
