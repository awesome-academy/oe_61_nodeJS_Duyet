import { NestFactory } from '@nestjs/core';
import { RoomModule } from './room.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    RoomModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.SERVICE_HOST || '127.0.0.1',
        port: parseInt(process.env.ROOM_SERVICE_PORT || '3002'),
      },
    },
  );

  await app.listen();
  console.log(
    `RoomService is running at tcp://${
      process.env.SERVICE_HOST || '127.0.0.1'
    }:${process.env.ROOM_SERVICE_PORT || 3002}`,
  );
}

void bootstrap();
