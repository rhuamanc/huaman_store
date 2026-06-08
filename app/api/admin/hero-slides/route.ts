import { z } from "zod";
import { connectDB } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { getCurrentAuth } from "@/lib/auth";
import HeroSlide from "@/models/HeroSlide";
import { DEFAULT_HERO_SLIDES } from "@/lib/heroSlides";

const slideSchema = z.object({
  title: z.string().min(3),
  subtitle: z.string().min(8),
  image: z.string().min(1),
  order: z.number().int().min(1),
});

const bodySchema = z.object({
  slides: z.array(slideSchema).length(3),
});

export async function GET() {
  await connectDB();
  const auth = await getCurrentAuth();

  if (!auth || auth.role !== "admin") {
    return fail("Solo administradores", 403);
  }

  const slides = await HeroSlide.find({}).sort({ order: 1 });

  if (!slides.length) {
    return ok({ slides: DEFAULT_HERO_SLIDES });
  }

  return ok({
    slides: slides.map((slide) => ({
      _id: slide._id.toString(),
      title: slide.title,
      subtitle: slide.subtitle,
      image: slide.image,
      order: slide.order,
    })),
  });
}

export async function PUT(req: Request) {
  await connectDB();
  const auth = await getCurrentAuth();

  if (!auth || auth.role !== "admin") {
    return fail("Solo administradores", 403);
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail("Datos del carrusel inválidos", 400);
  }

  await Promise.all(
    parsed.data.slides.map((slide) =>
      HeroSlide.findOneAndUpdate(
        { order: slide.order },
        { $set: slide },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  const slides = await HeroSlide.find({}).sort({ order: 1 });

  return ok({
    slides: slides.map((slide) => ({
      _id: slide._id.toString(),
      title: slide.title,
      subtitle: slide.subtitle,
      image: slide.image,
      order: slide.order,
    })),
  });
}
