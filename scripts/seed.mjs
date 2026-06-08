import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const DEFAULT_HERO_SLIDES = [
  {
    order: 1,
    title: "Vende lo que ya no usas",
    subtitle: "Publica tu anuncio gratis en minutos y llega a miles de compradores.",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop",
  },
  {
    order: 2,
    title: "Tecnología al mejor precio",
    subtitle: "Celulares, laptops y más. Encuentra ofertas de vendedores verificados.",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1600&auto=format&fit=crop",
  },
  {
    order: 3,
    title: "Renueva tu hogar",
    subtitle: "Muebles, decoración y electrodomésticos con pago seguro por Pago Link.",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop",
  },
];

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://rhuamanc21_db_user:vmHsQLKtkvWzmXXa@cluster0.ik5cg80.mongodb.net/huaman?retryWrites=true&w=majority&appName=Cluster0";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    role: { type: String, enum: ["user", "admin"] },
  },
  { timestamps: true }
);

const listingSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    price: Number,
    category: String,
    images: [String],
    status: String,
    moderationStatus: String,
    paymentLink: String,
    geo: {
      lat: Number,
      lng: Number,
      address: String,
      city: String,
    },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing" },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: String,
  },
  { timestamps: true }
);

const heroSlideSchema = new mongoose.Schema(
  {
    title: String,
    subtitle: String,
    image: String,
    order: Number,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Listing = mongoose.models.Listing || mongoose.model("Listing", listingSchema);
const Conversation = mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);
const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);
const HeroSlide = mongoose.models.HeroSlide || mongoose.model("HeroSlide", heroSlideSchema);

async function seed() {
  await mongoose.connect(MONGO_URI, { dbName: "huaman" });

  await Promise.all([
    Message.deleteMany({}),
    Conversation.deleteMany({}),
    Listing.deleteMany({}),
    HeroSlide.deleteMany({}),
    User.deleteMany({}),
  ]);

  await HeroSlide.create(DEFAULT_HERO_SLIDES);

  const admin = await User.create({
    name: "Admin Huaman",
    email: "admin@huaman.com",
    passwordHash: await bcrypt.hash("admin123", 10),
    role: "admin",
  });

  const userAna = await User.create({
    name: "Ana Quispe",
    email: "ana@huaman.com",
    passwordHash: await bcrypt.hash("123456", 10),
    role: "user",
  });

  const userLuis = await User.create({
    name: "Luis Rojas",
    email: "luis@huaman.com",
    passwordHash: await bcrypt.hash("123456", 10),
    role: "user",
  });

  const listings = await Listing.create([
    {
      title: "Casaca de cuero negra",
      description: "Casaca talla M en excelente estado, poco uso.",
      price: 220,
      category: "Ropa",
      images: ["https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?q=80&w=1200&auto=format&fit=crop"],
      status: "published",
      moderationStatus: "approved",
      seller: userAna._id,
      geo: {
        lat: -12.04637,
        lng: -77.04279,
        address: "Cercado de Lima",
        city: "Lima",
      },
      paymentLink: "https://example.com/pago/casaca",
    },
    {
      title: "iPhone 13 128GB",
      description: "Equipo libre de operador, batería al 88%, incluye cargador.",
      price: 2100,
      category: "Electrónica",
      images: ["https://images.unsplash.com/photo-1603899122361-e99f9f2fb5f5?q=80&w=1200&auto=format&fit=crop"],
      status: "published",
      moderationStatus: "approved",
      seller: userLuis._id,
      geo: {
        lat: -12.06211,
        lng: -77.03653,
        address: "Lince",
        city: "Lima",
      },
      paymentLink: "https://example.com/pago/iphone13",
    },
    {
      title: "Sofá 3 cuerpos gris",
      description: "Sofá cómodo para sala, sin roturas, 2 años de uso.",
      price: 750,
      category: "Hogar",
      images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1200&auto=format&fit=crop"],
      status: "published",
      moderationStatus: "approved",
      seller: userAna._id,
      geo: {
        lat: -12.0892,
        lng: -77.01652,
        address: "Surquillo",
        city: "Lima",
      },
      paymentLink: "https://example.com/pago/sofa",
    },
  ]);

  const conversation = await Conversation.create({
    listing: listings[1]._id,
    buyer: userAna._id,
    seller: userLuis._id,
  });

  await Message.create([
    {
      conversation: conversation._id,
      sender: userAna._id,
      text: "Hola, ¿todavía disponible el iPhone?",
    },
    {
      conversation: conversation._id,
      sender: userLuis._id,
      text: "Sí, disponible. Podemos coordinar entrega hoy.",
    },
  ]);

  console.log("Seed completado en BD huaman.");
  console.log("Usuarios creados:");
  console.log("- admin@huaman.com / admin123 (admin)");
  console.log("- ana@huaman.com / 123456");
  console.log("- luis@huaman.com / 123456");

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
