import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.AUTH_SERVICE_HOST || '127.0.0.1',
        port: parseInt(process.env.AUTH_SERVICE_PORT || '3001'),
      },
    },
  );

  await app.listen();
  console.log(
    `AuthService is running at tcp://${
      process.env.AUTH_SERVICE_HOST || '127.0.0.1'
    }:${process.env.AUTH_SERVICE_PORT || 3001}`,
  );
}

void bootstrap();
