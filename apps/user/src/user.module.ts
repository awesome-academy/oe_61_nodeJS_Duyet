import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { DatabaseModule, Role, User } from '@app/database';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@app/common';

@Module({
  imports: [
    DatabaseModule,
    CommonModule,
    TypeOrmModule.forFeature([User, Role]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
