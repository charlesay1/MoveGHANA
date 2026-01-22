import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new AllExceptionsFilter());

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const log = {
        level: 'info',
        msg: 'request',
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - start,
      };
      console.log(JSON.stringify(log));
    });
    next();
  });

  const port = process.env.PORT || process.env.API_PORT || 4000;
  await app.listen(port);
}

bootstrap();
