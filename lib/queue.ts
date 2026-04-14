import { Queue } from 'bullmq';
import { redis } from './redis';

// Define names for our queues
export const QUEUES = {
  POST_SCHEDULER: 'post-scheduler',
  ANALYTICS_FETCHER: 'analytics-fetcher',
  AUTO_REPLY: 'auto-reply',
};

// Create queue instances
export const postQueue = new Queue(QUEUES.POST_SCHEDULER, { connection: redis });
export const analyticsQueue = new Queue(QUEUES.ANALYTICS_FETCHER, { connection: redis });
export const autoReplyQueue = new Queue(QUEUES.AUTO_REPLY, { connection: redis });
