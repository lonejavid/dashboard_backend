import cors from 'cors';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config, getCorsOrigin } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOptions = {
    origin: getCorsOrigin(),
    methods: ['GET', 'POST', 'OPTIONS', 'HEAD'] as const,
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  app.use(cors(corsOptions));
  app.enableCors(corsOptions);

  const port = config.port;
  await app.listen(port);
  if (config.nodeEnv !== 'test') {
    console.log(`Listening on port ${port}`);
  }
}
bootstrap();
