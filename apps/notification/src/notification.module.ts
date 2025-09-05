import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import * as path from 'path';
import { EmailProcessor } from './email.processor';
import { CommonModule } from '@app/common';
import { I18nService } from 'nestjs-i18n';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: './.env' }),
    CommonModule,
    BullModule.registerQueueAsync({
      name: 'emails',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule, CommonModule],
      inject: [ConfigService, I18nService],
      useFactory: (configService: ConfigService, i18n: I18nService) => ({
        transport: {
          host: configService.get('MAIL_HOST'),
          port: configService.get('MAIL_PORT'),
          secure: false, // true for 465, false for other ports
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"${i18n.t('auth.SENDER_NAME', { lang: 'vi' })}" <${configService.get('MAIL_FROM')}>`,
        },
        template: {
          dir: configService.get<string>('MAIL_TEMPLATE_DIR') || path.join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  // Đăng ký EmailProcessor để nó có thể xử lý các job
  providers: [EmailProcessor],
})
export class NotificationModule {}
