import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { CloudinaryProvider } from './cloudinary/cloudinary.provider';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: './.env' }),
    // Register the client to be able to "talk" back to RoomService
    ClientsModule.registerAsync([
      {
        name: 'ROOM_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('SERVICE_HOST', '127.0.0.1'),
            port: configService.get<number>('ROOM_SERVICE_PORT', 3002),
          },
        }),
      },
    ]),
    CommonModule,
  ],
  controllers: [UploadController],
  providers: [CloudinaryProvider, CloudinaryService],
})
export class UploadModule {}
