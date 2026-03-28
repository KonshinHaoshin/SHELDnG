import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
    });

    redisClient.on("error", (err) => {
      console.error("Redis connection error:", err.message);
    });

    redisClient.on("connect", () => {
      console.log("Redis connected");
    });
  }
  return redisClient;
}

export async function setRoom(roomId: string, data: unknown): Promise<void> {
  try {
    await getRedis().set(`room:${roomId}`, JSON.stringify(data), "EX", 3600 * 24);
  } catch (err) {
    console.warn("Redis setRoom failed, using in-memory fallback");
    inMemoryStore.set(`room:${roomId}`, data);
  }
}

export async function getRoom(roomId: string): Promise<unknown | null> {
  try {
    const data = await getRedis().get(`room:${roomId}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return inMemoryStore.get(`room:${roomId}`) ?? null;
  }
}

export async function deleteRoom(roomId: string): Promise<void> {
  try {
    await getRedis().del(`room:${roomId}`);
  } catch {
    inMemoryStore.delete(`room:${roomId}`);
  }
}

// In-memory fallback when Redis is unavailable
const inMemoryStore = new Map<string, unknown>();
