import "dotenv/config";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import morgan from "morgan";
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

app.use((_request, response) => {
  response.status(404).json({ error: "Ruta no encontrada." });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
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
