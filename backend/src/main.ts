import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Fallback to allow local React frontend if CORS_ORIGIN is not defined in .env
  const corsOrigin = config.get<string>('CORS_ORIGIN') || 'http://localhost:5173';
  app.enableCors({ origin: corsOrigin });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Prevents sudden 400/404 errors during testing
      transform: true,
    }),
  );

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend running on: http://localhost:${port}`);
}
await bootstrap();