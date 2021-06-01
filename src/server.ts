import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";

import config from "./config";
import { signup, signin, protect, refreshToken, logout } from "./utils/auth";

export const app = express();

app.disable("x-powered-by");

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev"));

app.post("/signup", signup);
app.post("/signin", signin);
app.post("/refresh_token", refreshToken);
app.post("/logout", protect(), logout);

app.get("/api/public", (_, res) => {
  // everybody can access to this endpoint
  res.json({ data: "You have reached the public endpoint 🐣." });
});

app.get("/api/protected", protect(), (_, res) => {
  // Only signed-in users can access to this endpoint
  res.json({
    data: "You have reached the protected endpoint 🦄.",
  });
});

app.get("/api/admin_only", protect("ADMIN"), (_, res) => {
  // Only admins can access to this endpoint
  res.json({
    data: "You have reached the admin only endpoint 🦍",
  });
});

export const start = async () => {
  app.listen(config.port, () => {
    console.log(`REST API on http://localhost:${config.port}/api`);
  });
};
