import { app } from "./app.js";

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT debe ser un número entre 1 y 65535.");
}

app.listen(port, () => {
  console.log(`CineClub backend escuchando en el puerto ${port}`);
});
