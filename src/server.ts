import express from "express";
import morgan from "morgan";
import cors from "cors";

import config from "./config";
import { signup, signin, protect } from "./utils/auth";

export const app = express();

app.disable("x-powered-by");

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.post("/signup", signup);
app.post("/signin", signin);

app.get("/api/public", (req, res) => {
  // everybody can access to this endpoint
  res.json({ data: "Hello, you have reached the public endpoint 🐣." });
});

app.get("/api/protected", protect(), (req, res) => {
  // Only signed-in users can access to this endpoint
  res.json({
    data: `Hello ${req.user.name}, you have reached the protected endpoint  🦄.`,
  });
});

app.get("/api/admin_only", protect("ADMIN"), (req, res) => {
  // Only signed-in users can access to this endpoint
  res.json({
    data: `Hello ${req.user.name}, you have reached the admin only endpoint 🦍`,
  });
});

export const start = async () => {
  app.listen(config.port, () => {
    console.log(`REST API on http://localhost:${config.port}/api`);
  });
};
