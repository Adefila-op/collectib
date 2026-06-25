import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "./config.js";
import type { AuthedRequest, JwtUser } from "./types.js";

const bearerSchema = z.string().regex(/^Bearer\s+.+$/i);

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!config.jwtSecret) {
      throw new Error("JWT_SECRET is not configured.");
    }

    const parsed = bearerSchema.safeParse(req.headers.authorization);
    if (!parsed.success) {
      return res.status(401).json({ error: "Missing bearer token." });
    }

    const token = parsed.data.replace(/^Bearer\s+/i, "");
    req.user = jwt.verify(token, config.jwtSecret) as JwtUser;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  const status =
    message.startsWith("Missing required") || message.includes("not configured") ? 500 : 400;

  return res.status(status).json({ error: message });
}
