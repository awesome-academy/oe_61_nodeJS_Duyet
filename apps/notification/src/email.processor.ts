import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Processor('emails')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly i18n: I18nService,
  ) {}

  @Process('send-welcome-email')
  async handleSendWelcomeEmail(
    job: Job<{
      email: string;
      name: string;
      activationCode: string;
      lang: string;
    }>,
  ) {
    const { email, name, activationCode, lang } = job.data;
    this.logger.log(`Bắt đầu gửi email chào mừng tới ${email}`);

    try {
      await this.mailerService.sendMail({
        to: email,
        // Use the correct key 'mail.WELCOME_SUBJECT' and pass the name argument
        subject: this.i18n.t('mail.WELCOME_SUBJECT', { lang, args: { name } }),
        template: 'welcome',
        // Provide all necessary translated strings to the template context
        context: {
          name: name,
          title: this.i18n.t('mail.TEMPLATE.TITLE', { lang }),
          header: this.i18n.t('mail.TEMPLATE.HEADER', { lang }),
          greeting: this.i18n.t('mail.TEMPLATE.GREETING', {
            lang,
            args: { name },
          }),
          thank_you_message: this.i18n.t('mail.TEMPLATE.THANK_YOU_MESSAGE', {
            lang,
          }),
          activationCode: activationCode,
          ignore_message: this.i18n.t('mail.TEMPLATE.IGNORE_MESSAGE', { lang }),
          footer: this.i18n.t('mail.TEMPLATE.FOOTER', { lang }),
        },
      });
      this.logger.log(`Đã gửi email chào mừng thành công tới ${email}`);
    } catch (error) {
      this.logger.error(
        `Gửi email chào mừng tới ${email} thất bại`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  @Process('send-pass-email')
  async handleSendPass(
    job: Job<{
      email: string;
      name: string;
      password: string;
      lang: string;
    }>,
  ) {
    const { email, name, password, lang } = job.data;
    this.logger.log(`Bắt đầu gửi email chào mừng tới ${email}`);

    try {
      await this.mailerService.sendMail({
        to: email,
        // Use the correct key 'mail.WELCOME_SUBJECT' and pass the name argument
        subject: this.i18n.t('mail.WELCOME_SUBJECT', { lang, args: { name } }),
        template: 'send-password',
        // Provide all necessary translated strings to the template context
        context: {
          name: name,
          title: this.i18n.t('mail.TEMPLATE.TITLE', { lang }),
          header: this.i18n.t('mail.TEMPLATE.HEADER', { lang }),
          greeting: this.i18n.t('mail.TEMPLATE.GREETING', {
            lang,
            args: { name },
          }),
          password_message: this.i18n.t('mail.TEMPLATE.PASSWORD_MESSAGE', {
            lang,
          }),
          password: password,
          ignore_message: this.i18n.t('mail.TEMPLATE.IGNORE_MESSAGE', { lang }),
          footer: this.i18n.t('mail.TEMPLATE.FOOTER', { lang }),
          password_note: this.i18n.t('mail.TEMPLATE.PASSWORD_NOTE', { lang }),
        },
      });
      this.logger.log(`Đã gửi email chào mừng thành công tới ${email}`);
    } catch (error) {
      this.logger.error(
        `Gửi email chào mừng tới ${email} thất bại`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  @Process('send-reset-password-email')
  async handleSendResetPasswordEmail(
    job: Job<{ email: string; name: string; resetToken: string; lang: string }>,
  ) {
    const { email, name, resetToken, lang } = job.data;
    this.logger.log(`Bắt đầu gửi email đặt lại mật khẩu ${email}`);

    try {
      await this.mailerService.sendMail({
        to: email,
        // Use the correct key 'mail.WELCOME_SUBJECT' and pass the name argument
        subject: this.i18n.t('mail.WELCOME_SUBJECT', { lang, args: { name } }),
        template: 'reset-password',
        // Provide all necessary translated strings to the template context
        context: {
          name: name,
          title: this.i18n.t('mail.TEMPLATE.TITLE', { lang }),
          header: this.i18n.t('mail.TEMPLATE.HEADER', { lang }),
          greeting: this.i18n.t('mail.TEMPLATE.GREETING', {
            lang,
            args: { name },
          }),
          forgot_password_message: this.i18n.t(
            'mail.TEMPLATE.FORGOT_PASSWORD_MESSAGE',
            {
              lang,
            },
          ),
          resetToken: resetToken,
          ignore_message: this.i18n.t('mail.TEMPLATE.IGNORE_MESSAGE', { lang }),
          footer: this.i18n.t('mail.TEMPLATE.FOOTER', { lang }),
        },
      });
      this.logger.log(`Đã gửi email đặt lại mật khẩu thành công tới ${email}`);
    } catch (error) {
      this.logger.error(
        `Gửi email đặt lại mật khẩu tới ${email} thất bại`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
