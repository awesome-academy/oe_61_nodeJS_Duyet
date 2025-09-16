import { NestFactory } from '@nestjs/core';
import { UploadModule } from './upload.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UploadModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.SERVICE_HOST || '127.0.0.1',
        port: parseInt(process.env.UPLOAD_SERVICE_PORT || '3003'),
      },
    },
  );

  await app.listen();
  console.log(
    `Upload Service is running at tcp://${
      process.env.SERVICE_HOST || '127.0.0.1'
    }:${process.env.UPLOAD_SERVICE_PORT || 3003}`,
  );
}
void bootstrap();
