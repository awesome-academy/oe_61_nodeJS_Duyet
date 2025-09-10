import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { DatabaseModule, Room, RoomType, Amenity } from '@app/database';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@app/common';

@Module({
  imports: [
    DatabaseModule,
    CommonModule,
    TypeOrmModule.forFeature([Room, RoomType, Amenity]),
  ],
  controllers: [RoomController],
  providers: [RoomService],
})
export class RoomModule {}
