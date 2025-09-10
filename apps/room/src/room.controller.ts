import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoomService } from './room.service';
import { ListRoomDto } from '@app/common/dto/list-room.dto';

@Controller()
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @MessagePattern({ cmd: 'list_rooms' })
  listRooms(@Payload() listRoomDto: ListRoomDto) {
    return this.roomService.listRooms(listRoomDto);
  }
}
