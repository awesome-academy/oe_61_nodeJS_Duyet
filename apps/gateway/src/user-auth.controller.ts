import {
  Body,
  Controller,
  Inject,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RpcErrorInterceptor } from '@app/common';
import { I18nContext } from 'nestjs-i18n';
import { RegisterUserDto } from '@app/common/dto/register-user.dto';
import { ActiveUserDto } from '@app/common/dto/token-active.dto';

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
}
