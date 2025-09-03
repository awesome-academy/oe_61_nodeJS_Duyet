import {
  Body,
  Controller,
  Inject,
  Post,
  ValidationPipe,
  UseInterceptors,
  Logger,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AdminLoginDto, JwtAuthGuard, RpcErrorInterceptor } from '@app/common';
import { I18nContext } from 'nestjs-i18n';
import { timeout } from 'rxjs';
import { Request } from 'express';

@Controller('admin/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @Post('login')
  @UseInterceptors(RpcErrorInterceptor)
  login(@Body(new ValidationPipe()) adminLoginDto: AdminLoginDto) {
    const i18n = I18nContext.current();
    const lang = i18n ? i18n.lang : 'vi';
    const payload = { adminLoginDto, lang };

    this.logger.log(`Login request for email: ${adminLoginDto.email}`);

    return this.authClient.send({ cmd: 'admin_login' }, payload).pipe(
      timeout(10000), // 10 second timeout
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: Request) {
    this.logger.log('Logout request received');

    const token = req.headers.authorization?.split(' ')[1];
    const lang = I18nContext.current()?.lang || 'vi';
    return this.authClient.send({ cmd: 'admin_logout' }, { token, lang });
  }
}
