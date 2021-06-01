import { Request, Response, NextFunction } from "express";
import { Role, User } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Joi from "joi";

import prisma from "../db";
import config from "../config";

const signupPayloadSchema = Joi.object({
  name: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).max(30).required(),
  role: Joi.string().valid(...Object.values(Role)), // Roles are defined in prisma schema.
});

const signinPayloadSchema = Joi.object({
  name: Joi.string().required(),
  password: Joi.string().required(),
});

const createAccessToken = (user: User) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    config.secrets.accessToken,
    {
      expiresIn: "15m",
    }
  );
};

const createRefreshToken = (user: User) => {
  return jwt.sign({ id: user.id }, config.secrets.refreshToken, {
    expiresIn: "7d",
  });
};

const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie(config.cookies.refreshToken, refreshToken, {
    httpOnly: true,
    path: "/refresh_token",
  });
};

export const signup = async (req: Request, res: Response) => {
  const payload = req.body;

  const { error } = signupPayloadSchema.validate(payload);
  // if any error in payload, only send the first message in concise form.
  if (error) return res.status(400).send({ error: error.details[0].message });

  try {
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const newUser = await prisma.user.create({
      data: { ...payload, password: hashedPassword },
    });

    return res
      .status(201)
      .json({ data: `'${newUser.name}' created successfully.` });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).send({
        error: `Username '${payload.name}' already taken.`,
      });
    }

    return res.status(500);
  }
};

export const signin = async (req: Request, res: Response) => {
  const payload = req.body;

  const { error } = signinPayloadSchema.validate(payload);
  // if any error in payload, only send the first message in concise form.
  if (error) return res.status(400).send({ error: error.details[0].message });

  const user = await prisma.user.findUnique({ where: { name: payload.name } });
  if (!user) return res.status(401).end();

  const isValid = await bcrypt.compare(payload.password, user.password);
  if (!isValid) return res.status(401).end();

  const refreshToken = createRefreshToken(user);
  setRefreshTokenCookie(res, refreshToken);

  const accessToken = createAccessToken(user);
  return res.status(201).json({ accessToken });
};

export const logout = async (_, res: Response) => {
  setRefreshTokenCookie(res, "");

  return res.json({ data: "succesfully logged out" });
};

export const refreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies[config.cookies.refreshToken];
  if (!refreshToken) return res.status(400).end();

  try {
    const { id } = jwt.verify(refreshToken, config.secrets.refreshToken);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(400).end();

    const accessToken = createAccessToken(user);

    return res.json({ accessToken });
  } catch (error) {
    return res.status(401).end();
  }
};

export const protect =
  (...allowedRoles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const bearer = req.headers.authorization;

    if (!bearer || !bearer.startsWith("Bearer ")) {
      return res.status(401).end();
    }

    const token = bearer.split("Bearer ")[1].trim();
    try {
      const { id, role } = await jwt.verify(token, config.secrets.accessToken);

      if (allowedRoles.length !== 0 && !allowedRoles.includes(role)) {
        return res.status(401).end();
      }

      // other middlewares down the pipeline can access the user id now!
      req.user = { id };
    } catch (e) {
      return res.status(401).end();
    }

    next();
  };
