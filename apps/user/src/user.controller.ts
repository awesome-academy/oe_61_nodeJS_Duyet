import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ListUserDto } from '@app/common';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern({ cmd: 'list_users' })
  listUsers(@Payload() listUserDto: ListUserDto) {
    return this.userService.listUsers(listUserDto);
  }
}
