import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const token = authorization.slice(7);
  const secret = process.env.API_JWT_SECRET;

  if (!secret) {
    console.error("API_JWT_SECRET is missing");

    return res.status(500).json({
      message: "Server configuration error",
    });
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: "knowledgehub-frontend",
      audience: "knowledgehub-backend",
    });

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      !/^[1-9]\d*$/.test(decoded.sub) ||
      typeof decoded.exp !== "number"
    ) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    res.locals.userId = decoded.sub;

    next();

  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}