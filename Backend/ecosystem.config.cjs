const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  apps: [
    {
      name: "web-server",
      script: "./server.js",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        DATABASE_URL: process.env.DATABASE_URL,
        CLIENT_URL: process.env.CLIENT_URL,
        PORT: process.env.PORT || 4000,
        REDIS_URL: process.env.REDIS_URL,
      },
    },
    {
      name: "demand-worker",
      script: "./workers/demandAnalysisWorker.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        DATABASE_URL: process.env.DATABASE_URL,
        CLIENT_URL: process.env.CLIENT_URL,
        REDIS_URL: process.env.REDIS_URL,
      },
    },
  ],
};