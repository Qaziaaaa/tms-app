import dns from "node:dns";
import mongoose from "mongoose";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

const TEST_DB_NAME = "tms_test";

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    if (process.env.TMS_TEST_MODE === "1") {
      const dbNameMatch = MONGODB_URI!.match(/\/([^/?]+)(\?|$)/);
      const dbName = dbNameMatch ? dbNameMatch[1] : "(default)";
      if (dbName !== TEST_DB_NAME) {
        throw new Error(
          `SAFETY GUARD: test mode requires the "${TEST_DB_NAME}" database but MONGODB_URI points at "${dbName}".`
        );
      }
    }
    cached.promise = mongoose.connect(MONGODB_URI!, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
