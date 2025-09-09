import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ForgotPasswordDto,
  JwtAuthGuard,
  ResetPasswordDto,
  RpcErrorInterceptor,
  VerifyTokenDto,
} from '@app/common';
import { I18nContext } from 'nestjs-i18n';
import { RegisterUserDto } from '@app/common/dto/register-user.dto';
import { ActiveUserDto } from '@app/common/dto/token-active.dto';
import { UserLoginDto } from '@app/common/dto/user-login.dto';
import { timeout } from 'rxjs';
import { GoogleAuthGuard } from './google-auth/google-auth.guard';
import { Request } from 'express';
import { User } from '@app/database';

@Controller('auth')
@UseInterceptors(RpcErrorInterceptor)
export class UserAuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @Post('register')
  register(@Body() registerUserDto: RegisterUserDto) {
    const lang = I18nContext.current()?.lang || 'vi';
    const payload = { registerUserDto, lang };
    return this.authClient.send({ cmd: 'user_register' }, payload);
  }

  @Post('active')
  active(@Body() ActiveUserDto: ActiveUserDto) {
    const lang = I18nContext.current()?.lang || 'vi';
    const payload = { ActiveUserDto, lang };
    return this.authClient.send({ cmd: 'user_active' }, payload);
  }

  @Post('login')
  @UseInterceptors(RpcErrorInterceptor)
  login(@Body() userLoginDto: UserLoginDto) {
    const i18n = I18nContext.current();
    const lang = i18n ? i18n.lang : 'vi';
    const payload = { userLoginDto, lang };

    return this.authClient.send({ cmd: 'user_login' }, payload).pipe(
      timeout(10000), // 10 second timeout
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: Request) {
    const token = req.headers.authorization?.split(' ')[1];
    const lang = I18nContext.current()?.lang || 'vi';
    return this.authClient.send({ cmd: 'user_logout' }, { token, lang });
  }

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {}

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  googleCallback(@Req() req: Request) {
    const lang = I18nContext.current()?.lang || 'vi';
    const user = req.user as User & { email: string };
    const payload = { email: user.email, lang };

    return this.authClient.send({ cmd: 'google_login' }, payload);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const lang = I18nContext.current()?.lang || 'vi';
    return this.authClient.send(
      { cmd: 'forgot_password' },
      { forgotPasswordDto, lang },
    );
  }

  @Post('verify-token')
  verifyToken(@Body() verifyTokenDto: VerifyTokenDto) {
    const lang = I18nContext.current()?.lang || 'vi';
    return this.authClient.send(
      { cmd: 'verify_reset_token' },
      { verifyTokenDto, lang },
    );
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const lang = I18nContext.current()?.lang || 'vi';
    return this.authClient.send(
      { cmd: 'reset_password' },
      { resetPasswordDto, lang },
    );
  }
}
