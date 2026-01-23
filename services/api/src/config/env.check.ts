import { config } from './config';

console.log(
  JSON.stringify(
    {
      status: 'ok',
      env: config.NODE_ENV,
      port: config.PORT,
      logLevel: config.LOG_LEVEL,
      timestamp: new Date().toISOString(),
    },
    null,
    2
  )
);
