import { ParseId } from '@app/common/decorators/parse-id.decorator';
import { ListRoomDto } from '@app/common/dto/list-room.dto';
import { Controller, Get, Inject, Query, ValidationPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('rooms')
export class RoomController {
  constructor(
    @Inject('ROOM_SERVICE') private readonly roomClient: ClientProxy,
  ) {}

  @Get()
  listRooms(
    @Query(new ValidationPipe({ transform: true })) listRoomDto: ListRoomDto,
  ) {
    return this.roomClient.send({ cmd: 'list_rooms' }, listRoomDto);
  }

  @Get(':id')
  getRoomById(@ParseId('id') id: number) {
    return this.roomClient.send({ cmd: 'get_room_by_id' }, { id });
  }
}
