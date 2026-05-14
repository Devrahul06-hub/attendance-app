import mongoose from 'mongoose';

/**
 * Cached MongoDB connection.
 * In dev, Next.js hot-reloads modules — caching the connection
 * on `global` prevents creating a new pool every reload.
 */
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

let cached = (global as any).mongoose;
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string, { bufferCommands: false })
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
