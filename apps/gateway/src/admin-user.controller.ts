import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard, ListUserDto, Roles, RolesGuard } from '@app/common';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminUserController {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  @Get()
  @Roles('admin')
  listUsers(@Query() listUserDto: ListUserDto) {
    return this.userClient.send({ cmd: 'list_users' }, listUserDto);
  }
}
