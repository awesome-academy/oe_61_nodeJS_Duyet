import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AdminLoginDto } from '@app/common';

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
    return this.authService.adminLogout(payload);
  }
}
