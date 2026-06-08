import { connectDB } from "@/lib/db";
import { ok } from "@/lib/api";
import HeroSlide from "@/models/HeroSlide";
import { DEFAULT_HERO_SLIDES } from "@/lib/heroSlides";

export async function GET() {
  await connectDB();
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
