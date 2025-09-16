import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from '@app/database';
import { Repository } from 'typeorm';
import { ListRoomDto } from '@app/common/dto/list-room.dto';
import { CreateRoomDto, LIMIT, PAGE, UpdateRoomDto } from '@app/common';
import { RpcException } from '@nestjs/microservices';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly i18n: I18nService,
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

  async getRoomById(id: number) {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: {
        roomType: true,
        roomAmenities: {
          amenity: true,
        },
      },
    });

    if (!room) {
      const message = this.i18n.t('room.NOT_FOUND', { args: { id } });
      throw new RpcException({ message, status: 404 });
    }
    return room;
  }

  async createRoom(payload: {
    createRoomDto: CreateRoomDto;
    lang: string;
    imageUrl: string | null;
  }) {
    const { createRoomDto, lang, imageUrl } = payload;

    const existingRoom = await this.roomRepository.findOne({
      where: { room_number: createRoomDto.room_number },
    });

    if (existingRoom) {
      throw new RpcException({
        message: this.i18n.t('room.EXISTS', { lang }),
        status: 409, // Conflict
      });
    }

    const createdRoom = this.roomRepository.create({
      ...createRoomDto,
      image: imageUrl,
    });

    return this.roomRepository.save(createdRoom);
  }

  async updateRoomInfo(
    id: number,
    updateRoomDto: UpdateRoomDto,
    lang: string,
  ): Promise<Room | null> {
    const existingRoom = await this.roomRepository.findOneBy({ id });
    if (!existingRoom) {
      throw new RpcException({
        message: this.i18n.t('room.NOT_FOUND', { lang, args: { id } }),
        status: 404, // Not Found
      });
    }
    await this.roomRepository.update(id, updateRoomDto);

    return await this.roomRepository.findOneBy({ id });
  }

  async deleteRoom(id: number, lang: string): Promise<Room | null> {
    const existingRoom = await this.roomRepository.findOneBy({ id });
    if (!existingRoom) {
      throw new RpcException({
        message: this.i18n.t('room.NOT_FOUND', { lang, args: { id } }),
        status: 404, // Not Found
      });
    }
    await this.roomRepository.delete(id);
    return existingRoom;
  }
}
