import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);

  await app.init();
  Logger.log('Notification service is running and listening for jobs.');
}

void bootstrap();
