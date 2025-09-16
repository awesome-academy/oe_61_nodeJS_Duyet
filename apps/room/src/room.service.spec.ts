/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { RoomService } from './room.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Room } from '@app/database';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';
import { CreateRoomDto, UpdateRoomDto } from '@app/common';
import { RpcException } from '@nestjs/microservices';
import { I18nService } from 'nestjs-i18n';

describe('RoomService', () => {
  let service: RoomService;
  let roomRepository: jest.Mocked<Repository<Room>>;
  let i18n: jest.Mocked<I18nService>;

  // Create a mock for the QueryBuilder to control its behavior
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        {
          provide: getRepositoryToken(Room),
          useValue: createMock<Repository<Room>>({
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          }),
        },
        {
          provide: I18nService,
          useValue: {
            t: jest
              .fn()
              .mockImplementation(
                (key: string, opts?: { lang?: string }) =>
                  `${key}_${opts?.lang}`,
              ),
          },
        },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
    roomRepository = module.get(getRepositoryToken(Room));
    i18n = module.get<I18nService>(I18nService) as jest.Mocked<I18nService>;
  });

  // Clean up all mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Test Suite for listRooms ---
  describe('listRooms', () => {
    it('should apply default pagination when no parameters are provided', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listRooms({});

      expect(roomRepository.createQueryBuilder).toHaveBeenCalledWith('room');
      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should apply a WHERE clause for the search parameter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listRooms({ search: 'deluxe' });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(room.room_number LIKE :search OR room.description LIKE :search)',
        { search: '%deluxe%' },
      );
    });

    it('should apply AND WHERE clauses for bed_number and air_conditioned', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listRooms({ bed_number: 2, air_conditioned: true });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'room.bed_number = :bed_number',
        { bed_number: 2 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'room.air_conditioned = :air_conditioned',
        { air_conditioned: true },
      );
    });

    it('should handle pagination correctly', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listRooms({
        page: 2,
        limit: 5,
        search: 'ocean',
        bed_number: 1,
      });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });

    it('should return the correct paginated result', async () => {
      const mockRooms = [{ id: 1, room_number: '101' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockRooms, 25]);

      const result = await service.listRooms({ page: 2, limit: 10 });

      expect(result.data).toEqual(mockRooms);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.last_page).toBe(3);
    });

    it('should throw error if query builder fails', async () => {
      const error = new Error('DB error');
      mockQueryBuilder.getManyAndCount.mockRejectedValue(error);

      await expect(service.listRooms({})).rejects.toThrow(error);
      expect(roomRepository.createQueryBuilder).toHaveBeenCalledWith('room');
    });
  });

  // --- Test Suite for createRoom ---
  describe('createRoom', () => {
    it('should throw if room already exists', async () => {
      roomRepository.findOne.mockResolvedValue({ id: 1 } as Room);

      await expect(
        service.createRoom({
          createRoomDto: { room_number: '101' } as CreateRoomDto,
          lang: 'en',
          imageUrl: null,
        }),
      ).rejects.toThrow(RpcException);

      expect(i18n.t).toHaveBeenCalledWith('room.EXISTS', { lang: 'en' });
    });

    it('should create and save new room if not exists', async () => {
      roomRepository.findOne.mockResolvedValue(null);
      roomRepository.create.mockReturnValue({
        id: 1,
        room_number: '101',
      } as Room);
      roomRepository.save.mockResolvedValue({
        id: 1,
        room_number: '101',
      } as Room);

      const result = await service.createRoom({
        createRoomDto: { room_number: '101' } as CreateRoomDto,
        lang: 'en',
        imageUrl: 'url',
      });

      expect(roomRepository.create).toHaveBeenCalled();
      expect(roomRepository.save).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });
  });

  // --- Test Suite for updateRoomInfo ---
  describe('updateRoomInfo', () => {
    it('should throw if room not found', async () => {
      roomRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateRoomInfo(
          1,
          { room_number: '202' } as UpdateRoomDto,
          'en',
        ),
      ).rejects.toThrow(RpcException);

      expect(i18n.t).toHaveBeenCalledWith('room.NOT_FOUND', {
        lang: 'en',
        args: { id: 1 },
      });
    });

    it('should update and return updated room', async () => {
      const existing = { id: 1, room_number: '101' } as Room;
      const updated = { id: 1, room_number: '202' } as Room;

      roomRepository.findOneBy
        .mockResolvedValueOnce(existing) // before update
        .mockResolvedValueOnce(updated); // after update
      roomRepository.update.mockResolvedValue({ affected: 1 } as UpdateResult);

      const result = await service.updateRoomInfo(
        1,
        { room_number: '202' } as UpdateRoomDto,
        'en',
      );

      expect(roomRepository.update).toHaveBeenCalledWith(1, {
        room_number: '202',
      });
      expect(result).toEqual(updated);
    });
  });

  // --- Test Suite for deleteRoom ---
  describe('deleteRoom', () => {
    it('should throw if room not found', async () => {
      roomRepository.findOneBy.mockResolvedValue(null);

      await expect(service.deleteRoom(1, 'en')).rejects.toThrow(RpcException);

      expect(i18n.t).toHaveBeenCalledWith('room.NOT_FOUND', {
        lang: 'en',
        args: { id: 1 },
      });
    });

    it('should delete and return the room if exists', async () => {
      const room = { id: 1, room_number: '101' } as Room;
      roomRepository.findOneBy.mockResolvedValue(room);
      roomRepository.delete.mockResolvedValue({ affected: 1 } as DeleteResult);

      const result = await service.deleteRoom(1, 'en');

      expect(roomRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(room);
    });
  });

  describe('getRoomById', () => {
    it('should return the room with relations if found', async () => {
      const room = { id: 1, room_number: '101' } as Room;
      roomRepository.findOne.mockResolvedValue(room);

      const result = await service.getRoomById(1);

      expect(roomRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: {
          roomType: true,
          roomAmenities: { amenity: true },
        },
      });
      expect(result).toEqual(room);
    });

    it('should throw RpcException if room not found', async () => {
      roomRepository.findOne.mockResolvedValue(null);

      await expect(service.getRoomById(1)).rejects.toThrow(RpcException);
      expect(i18n.t).toHaveBeenCalledWith('room.NOT_FOUND', {
        args: { id: 1 },
      });
    });
  });
});
