import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI!;
if (!MONGO_URI) throw new Error("Missing MONGO_URI");

type Cached = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
let cached = (global as any)._mongoose as Cached | undefined;
if (!cached) cached = (global as any)._mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached!.conn) return cached!.conn;
  if (!cached!.promise) {
    mongoose.set("strictQuery", true);
    cached!.promise = mongoose.connect(MONGO_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }
  cached!.conn = await cached!.promise;
  return cached!.conn;
}
