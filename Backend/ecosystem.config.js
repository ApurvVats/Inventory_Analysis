// ecosystem.config.js
import dotenv from 'dotenv';
dotenv.config(); // Load env variables for PM2

export default {
  apps: [
    {
      name: 'web-server',
      script: './server.js',
      instances: 1,
      exec_mode: 'cluster',
      node_args: '--experimental-specifier-resolution=node',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: process.env.DATABASE_URL,
        CLIENT_URL: process.env.CLIENT_URL,
        PORT: process.env.PORT || 4000,
      },
    },
    {
      name: 'demand-worker',
      script: './workers/demandAnalysisWorker.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      node_args: '--experimental-specifier-resolution=node',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: process.env.DATABASE_URL,
        CLIENT_URL: process.env.CLIENT_URL,
      },
    },
  ],
};
