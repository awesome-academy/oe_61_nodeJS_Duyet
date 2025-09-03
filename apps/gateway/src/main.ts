import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import { ValidationPipe } from '@nestjs/common';
import { RpcErrorInterceptor } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new RpcErrorInterceptor());

  const port = parseInt(process.env.GATEWAY_PORT || '3000');
  await app.listen(port);
  console.log(`Gateway is running on http://localhost:${port}`);
}
void bootstrap();
