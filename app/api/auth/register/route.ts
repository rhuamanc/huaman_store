import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import User from "@/models/User";
import { signToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { toUserSafe } from "@/lib/serializers";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  await connectDB();
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return fail("Datos inválidos", 400);
  }

  const { name, email, password } = parsed.data;
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    return fail("El email ya está registrado", 409);
  }

  const totalUsers = await User.countDocuments();
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: totalUsers === 0 ? "admin" : "user",
  });

  const token = signToken({
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
  });

  const response = ok({ user: toUserSafe(user) }, 201);
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
