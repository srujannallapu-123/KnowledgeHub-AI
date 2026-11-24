import "server-only";
import jwt from "jsonwebtoken";
import { auth } from "@/auth";

export async function createApiToken() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  const secret = process.env.API_JWT_SECRET;

  if (!secret) {
    throw new Error("API_JWT_SECRET is missing");
  }

  return jwt.sign({}, secret, {
    algorithm: "HS256",
    subject: session.user.id,
    issuer: "knowledgehub-frontend",
    audience: "knowledgehub-backend",
    expiresIn: "5m",
  });
}