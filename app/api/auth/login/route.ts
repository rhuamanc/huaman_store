import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import User from "@/models/User";
import { signToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { toUserSafe } from "@/lib/serializers";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  await connectDB();
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return fail("Credenciales inválidas", 400);
  }

  const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (!user) {
    return fail("Email o contraseña inválidos", 401);
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return fail("Email o contraseña inválidos", 401);
  }

  const token = signToken({
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
  });

  const response = ok({ user: toUserSafe(user) });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
