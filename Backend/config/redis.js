import IORedis from 'ioredis';
export const redisConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // This is important for BullMQ
});
redisConnection.on('connect', () => console.log('Connected to Redis'));
redisConnection.on('error', (err) => console.error('Redis Connection Error', err));
