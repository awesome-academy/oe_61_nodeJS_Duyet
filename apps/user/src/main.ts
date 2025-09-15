import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.SERVICE_HOST || '127.0.0.1',
        port: parseInt(process.env.USER_SERVICE_PORT || '3004'),
      },
    },
  );

  await app.listen();
  console.log(
    `UserService is running at tcp://${
      process.env.SERVICE_HOST || '127.0.0.1'
    }:${process.env.USER_SERVICE_PORT || 3004}`,
  );
}

void bootstrap();
