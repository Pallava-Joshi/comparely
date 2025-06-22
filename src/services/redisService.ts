import { createClient, RedisClientType } from 'redis';
import config from '../config';
import { SessionData } from '../types';

let client: RedisClientType;

async function initializeRedisClient() {
  if (!client) {
    client = createClient({
      url: config.REDIS_URL
    });

    client.on('error', (err : unknown ) => console.error('Redis Client Error', err));
    await client.connect();
    console.log('Redis client connected.');
  }
}

export async function setSession(sessionId: string, data: SessionData, expirySeconds: number = 3600): Promise<void> {
  await initializeRedisClient();
  await client.setEx(sessionId, expirySeconds, JSON.stringify(data));
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  await initializeRedisClient();
  const data = await client.get(sessionId);
  return data ? (JSON.parse(data) as SessionData) : null;
}