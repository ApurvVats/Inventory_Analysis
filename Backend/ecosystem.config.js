module.exports = {
  apps: [
    {
      name: 'web-server',
      script: './server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'demand-worker',
      script: './workers/demandAnalysisWorker.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,   
      max_restarts: 10,   
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};