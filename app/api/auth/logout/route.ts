import { ok } from "@/lib/api";
import { COOKIE_NAME } from "@/lib/constants";

export async function POST() {
  const response = ok({ message: "Sesión cerrada" });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
