/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { RoomService } from './room.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Room } from '@app/database';
import { Repository } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';
import { ListRoomDto } from '@app/common/dto/list-room.dto';

describe('RoomService', () => {
  let service: RoomService;
  let roomRepository: Repository<Room>;

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
          // Use createMock for a basic repository mock
          useValue: createMock<Repository<Room>>({
            // Mock createQueryBuilder to return our controlled mockQueryBuilder
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          }),
        },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
    roomRepository = module.get<Repository<Room>>(getRepositoryToken(Room));
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
    // --- Scenario 1: No filters (default case) ---
    it('should apply default pagination when no parameters are provided', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listRooms({});

      expect(roomRepository.createQueryBuilder).toHaveBeenCalledWith('room');
      expect(mockQueryBuilder.where).not.toHaveBeenCalled(); // No filters should be applied
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0); // (1 - 1) * 10
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalledTimes(1);
    });

    // --- Scenario 2: With search filter ---
    it('should apply a WHERE clause for the search parameter', async () => {
      const dto: ListRoomDto = { search: 'deluxe' };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listRooms(dto);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(room.room_number LIKE :search OR room.description LIKE :search)',
        { search: `%deluxe%` },
      );
    });

    // --- Scenario 3: With bed_number and air_conditioned filters ---
    it('should apply AND WHERE clauses for filter parameters', async () => {
      const dto: ListRoomDto = { bed_number: 2, air_conditioned: true };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listRooms(dto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'room.bed_number = :bed_number',
        { bed_number: 2 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'room.air_conditioned = :air_conditioned',
        { air_conditioned: true },
      );
    });

    // --- Scenario 4: With a combination of all filters and pagination ---
    it('should correctly chain all clauses', async () => {
      const dto: ListRoomDto = {
        page: 2,
        limit: 5,
        search: 'ocean',
        bed_number: 1,
      };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listRooms(dto);

      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5); // (2 - 1) * 5
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });

    // --- Scenario 5: Check the return value ---
    it('should return the correct paginated result structure', async () => {
      const mockRooms = [{ id: 1, room_number: '101' }];
      const total = 25;
      const dto: ListRoomDto = { page: 2, limit: 10 };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockRooms, total]);

      const result = await service.listRooms(dto);

      expect(result.data).toEqual(mockRooms);
      expect(result.total).toBe(total);
      expect(result.page).toBe(2);
      expect(result.last_page).toBe(3); // Math.ceil(25 / 10)
    });
  });
});
