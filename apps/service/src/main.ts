import { NestFactory } from '@nestjs/core';
import { ServiceModule } from './service.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.SERVICE_HOST || '127.0.0.1',
        port: parseInt(process.env.SERVICE_SERVICE_PORT || '3007'),
      },
    },
  );

  await app.listen();
  console.log(
    `Service is running at tcp://${
      process.env.SERVICE_HOST || '127.0.0.1'
    }:${process.env.SERVICE_SERVICE_PORT || 3007}`,
  );
}

void bootstrap();
