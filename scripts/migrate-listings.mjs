/**
 * Migra los listings de data/listings.json a MongoDB.
 * Ejecutar una sola vez: node scripts/migrate-listings.mjs
 */

import { readFile } from "fs/promises";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// Leer .env.local manualmente
const envRaw = await readFile(path.join(ROOT, ".env.local"), "utf-8");
const env = Object.fromEntries(
  envRaw
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => l.split("=").map((p, i) => (i === 0 ? p.trim() : l.slice(l.indexOf("=") + 1).trim())))
);

const MONGO_URI = env.MONGO_URI;
if (!MONGO_URI) throw new Error("MONGO_URI no encontrado en .env.local");

const require = createRequire(import.meta.url);
const mongoose = require("mongoose");

// Schema mínimo para la migración
const ListingSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    price: Number,
    category: String,
    images: [String],
    status: { type: String, default: "published" },
    moderationStatus: { type: String, default: "pending" },
    paymentLink: String,
    sizes: [{ label: String, price: Number, paymentLink: String }],
    geo: { lat: Number, lng: Number, address: String, city: String },
    seller: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

const Listing =
  mongoose.models.Listing || mongoose.model("Listing", ListingSchema);

await mongoose.connect(MONGO_URI);
console.log("✅ Conectado a MongoDB");

const jsonRaw = await readFile(path.join(ROOT, "data", "listings.json"), "utf-8");
const listings = JSON.parse(jsonRaw);

// ID del dueño de la tienda (todos los anuncios son suyos)
const OWNER_ID = "69d04a87d8677fd66e879eef";

let insertados = 0;
let saltados = 0;

for (const l of listings) {
  // Verificar si ya existe (por título + precio para evitar duplicados)
  const existe = await Listing.findOne({ title: l.title, price: l.price });
  if (existe) {
    console.log(`⏭  Ya existe: "${l.title}"`);
    saltados++;
    continue;
  }

  const sellerId = l.seller && l.seller !== "anonymous" ? l.seller : OWNER_ID;

  await Listing.create({
    title: l.title,
    description: l.description,
    price: l.price,
    category: l.category,
    images: l.images.map((img) => img.trim()),
    status: l.status || "published",
    moderationStatus: "pending",
    paymentLink: l.paymentLink || undefined,
    sizes: l.sizes || [],
    geo: l.geo || undefined,
    seller: new mongoose.Types.ObjectId(sellerId),
    createdAt: new Date(l.createdAt),
    updatedAt: new Date(l.updatedAt),
  });

  console.log(`✅ Insertado: "${l.title}"`);
  insertados++;
}

console.log(`\n🏁 Migración completada: ${insertados} insertados, ${saltados} saltados.`);
await mongoose.disconnect();
