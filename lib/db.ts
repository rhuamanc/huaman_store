import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

function getMongoUri() {
  if (!MONGO_URI) {
    throw new Error("Falta la variable MONGO_URI en el entorno.");
  }
  return MONGO_URI;
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cache;

export async function connectDB() {
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(getMongoUri(), {
      dbName: "huaman",
      bufferCommands: false,
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
