import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');

  // To ustawienie wita naszego "zwiadowcę" i wpuszcza go do środka
  app.enableCors({
    origin: 'http://localhost:3000', 
    credentials: true,
  });

  await app.listen(3002);
}
bootstrap();