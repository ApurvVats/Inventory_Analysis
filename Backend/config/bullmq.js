import { Queue } from 'bullmq';
import { redisConnection } from './redis.js';
export const demandAnalysisQueue = new Queue('DemandAnalysisQueue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, 
    backoff: {
      type: 'exponential',
      delay: 5000, 
    },
  },
});
