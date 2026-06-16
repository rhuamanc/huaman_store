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
  if (cache.conn && cache.conn.connection.readyState === 1) {
    return cache.conn;
  }

  // In serverless environments, cached connections can become stale after freezes.
  if (cache.conn && cache.conn.connection.readyState !== 1) {
    cache.conn = null;
    cache.promise = null;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(getMongoUri(), {
      dbName: "huaman",
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (error) {
    // Reset cache on connection failure so next request can retry cleanly.
    cache.conn = null;
    cache.promise = null;
    throw error;
  }
}
