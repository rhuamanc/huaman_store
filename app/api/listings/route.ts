import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { fail, ok } from "@/lib/api";
import { CATEGORIES } from "@/types";
import { getCurrentAuth } from "@/lib/auth";

const DATA_FILE = path.join(process.cwd(), "data", "listings.json");

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  status: string;
  paymentLink?: string;
  sizes?: { label: string; price?: number; paymentLink: string }[];
  geo?: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
  };
  seller: string;
  createdAt: string;
  updatedAt: string;
}

const createSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  price: z.number().nonnegative(),
  category: z.enum(CATEGORIES),
  images: z.array(z.string().min(1)).default([]),
  status: z.enum(["draft", "published", "sold", "archived"]).default("published"),
  geo: z
    .object({
      lat: z.number(),
      lng: z.number(),
      address: z.string().optional(),
      city: z.string().optional(),
    })
    .optional(),
  paymentLink: z.string().url().optional().or(z.literal("")),
  sizes: z
    .array(
      z.object({
        label: z.string().min(1),
        price: z.number().nonnegative().optional(),
        paymentLink: z.string().url(),
      })
    )
    .optional(),
});

async function readListings(): Promise<Listing[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeListings(listings: Listing[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(listings, null, 2));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const query = searchParams.get("q");

  let listings = await readListings();

  if (category && CATEGORIES.includes(category as never)) {
    listings = listings.filter((l) => l.category === category);
  }

  if (query) {
    const q = query.toLowerCase();
    listings = listings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
    );
  }

  listings = listings
    .filter((l) => l.status === "published")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 80);

  return ok({ listings });
}

export async function POST(req: Request) {
  const auth = await getCurrentAuth();

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return fail(`Datos inválidos: ${errors}`, 400);
  }

  const listings = await readListings();
  const newListing: Listing = {
    id: Date.now().toString(),
    ...parsed.data,
    seller: auth?.userId || "anonymous",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  listings.push(newListing);
  await writeListings(listings);

  return ok({ listing: newListing }, 201);
}
