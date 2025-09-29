import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { CommonModule, RpcErrorInterceptor, JwtAuthGuard } from '@app/common';
import { AuthController } from './auth.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bull';
import { UserAuthController } from './user-auth.controller';
import { APP_PIPE } from '@nestjs/core';
import { I18nValidationPipe } from '@app/common/pipes/i18n-validation.pipe';
import googleOauthConfig from 'libs/config/google-oauth.config';
import { GoogleStrategy } from './strategies/google.strategy';
import { AuthModule } from 'apps/auth/src/auth.module';
import { RoomController } from './room.controller';
import { AdminUserController } from './admin-user.controller';
import { AdminRoomController } from './admin-room.controller';
import { BookingController } from './booking.controller';
import { AdminInvoiceController } from './admin-invoice.controller';
import { AdminServiceController } from './admin-service.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: './.env' }),
    CommonModule,
    AuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30d'),
        },
      }),
    }),
    CommonModule,
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('SERVICE_HOST'),
            port: configService.get<number>('AUTH_SERVICE_PORT'),
          },
        }),
      },
      {
        name: 'ROOM_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('SERVICE_HOST'),
            port: configService.get<number>('ROOM_SERVICE_PORT'),
          },
        }),
      },
      {
        name: 'USER_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('SERVICE_HOST'),
            port: configService.get<number>('USER_SERVICE_PORT'),
          },
        }),
      },
      {
        name: 'UPLOAD_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('SERVICE_HOST'),
            port: configService.get<number>('UPLOAD_SERVICE_PORT'),
          },
        }),
      },
      {
        name: 'SERVICE_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('SERVICE_HOST'),
            port: configService.get<number>('SERVICE_SERVICE_PORT'),
          },
        }),
      },
      {
        name: 'BOOKING_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('SERVICE_HOST'),
            port: configService.get<number>('BOOKING_SERVICE_PORT'),
          },
        }),
      },
      {
        name: 'PAYMENT_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('SERVICE_HOST'),
            port: configService.get<number>('INVOICE_SERVICE_PORT'),
          },
        }),
      },
    ]),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    ConfigModule.forFeature(googleOauthConfig),
  ],
  controllers: [
    GatewayController,
    AuthController,
    UserAuthController,
    RoomController,
    AdminUserController,
    AdminRoomController,
    BookingController,
    AdminInvoiceController,
    AdminServiceController,
  ],
  providers: [
    GatewayService,
    RpcErrorInterceptor,
    JwtAuthGuard,
    {
      provide: APP_PIPE,
      useClass: I18nValidationPipe,
    },
    GoogleStrategy,
  ],
})
export class GatewayModule {}
