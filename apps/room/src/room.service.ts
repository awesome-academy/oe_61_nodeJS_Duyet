import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from '@app/database';
import { Repository } from 'typeorm';
import { ListRoomDto } from '@app/common/dto/list-room.dto';
import { LIMIT, PAGE } from '@app/common';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async listRooms(listRoomDto: ListRoomDto) {
    const {
      page = PAGE,
      limit = LIMIT,
      search,
      bed_number,
      air_conditioned,
    } = listRoomDto;

    const queryBuilder = this.roomRepository.createQueryBuilder('room');

    if (search) {
      queryBuilder.where(
        '(room.room_number LIKE :search OR room.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (bed_number) {
      queryBuilder.andWhere('room.bed_number = :bed_number', { bed_number });
    }

    if (air_conditioned !== undefined) {
      queryBuilder.andWhere('room.air_conditioned = :air_conditioned', {
        air_conditioned,
      });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      last_page: Math.ceil(total / limit),
    };
  }
}
