import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';
// This queue will handle all stages of the demand analysis job
export const demandAnalysisQueue = new Queue('demandAnalysisQueue', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 2, // Retry a failed job up to 2 times
        backoff: {
            type: 'exponential',
            delay: 5000, // Wait 5 seconds before the first retry
        },
    },
});