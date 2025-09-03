import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AdminLoginDto } from '@app/common';
import { RegisterUserDto } from '@app/common/dto/register-user.dto';
import { ActiveUserDto } from '@app/common/dto/token-active.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Listen for messages with pattern 'admin_login' from Gateway
  @MessagePattern({ cmd: 'admin_login' })
  login(@Payload() payload: { adminLoginDto: AdminLoginDto; lang: string }) {
    return this.authService.adminLogin(payload);
  }

  @MessagePattern({ cmd: 'admin_logout' })
  logout(@Payload() payload: { token: string; lang: string }) {
    return this.authService.logout(payload);
  }

  @MessagePattern({ cmd: 'user_register' })
  register(
    @Payload() payload: { registerUserDto: RegisterUserDto; lang: string },
  ) {
    return this.authService.userRegister(payload);
  }

  @MessagePattern({ cmd: 'user_active' })
  active(@Payload() payload: { ActiveUserDto: ActiveUserDto; lang: string }) {
    return this.authService.userActive(payload);
  }
}
