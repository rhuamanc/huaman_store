import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { COOKIE_NAME, JWT_EXPIRES_IN } from "@/lib/constants";

export interface AuthPayload {
  userId: string;
  role: "user" | "admin";
  email: string;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Falta la variable JWT_SECRET en el entorno.");
  }
  return secret;
}

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, getJwtSecret()) as AuthPayload;
}

export async function getCurrentAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
