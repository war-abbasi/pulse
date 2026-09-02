import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      // Strip any property that has no decorator in the DTO. A client can send
      // { username, password, isAdmin: true } and isAdmin never reaches the
      // service — it is removed before the handler runs.
      whitelist: true,
      // Go further: reject the request outright rather than silently dropping
      // unknown properties. Surfaces client bugs instead of hiding them.
      forbidNonWhitelisted: true,
      // Turn the plain request body into an actual instance of the DTO class,
      // and coerce primitives (e.g. a route param "5" into a number).
      transform: true,
    }),
  );

  app.enableCors({ origin: config.getOrThrow<string>('CORS_ORIGIN') });

  await app.listen(config.get<number>('PORT') ?? 3000);
}
await bootstrap();
