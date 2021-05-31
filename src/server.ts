import express from "express";
import morgan from "morgan";
import cors from "cors";

import config from "./config";

export const app = express();

app.disable("x-powered-by");

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api", (_, res) => {
  res.send("hello");
});

export const start = async () => {
  app.listen(config.port, () => {
    console.log(`REST API on http://localhost:${config.port}/api`);
  });
};
