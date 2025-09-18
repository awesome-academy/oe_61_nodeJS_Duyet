import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './payment.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.SERVICE_HOST || '127.0.0.1',
        port: parseInt(process.env.INVOICE_SERVICE_PORT || '3008'),
      },
    },
  );

  await app.listen();
  console.log(
    `InvoiceService is running at tcp://${
      process.env.SERVICE_HOST || '127.0.0.1'
    }:${process.env.INVOICE_SERVICE_PORT || 3008}`,
  );
}

void bootstrap();
