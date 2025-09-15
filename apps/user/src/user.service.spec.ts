/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '@app/database';
import { Repository } from 'typeorm';
import { ListUserDto } from '@app/common';
import { createMock } from '@golevelup/ts-jest';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;

  // 1. Create a "stand-in" (mock) for QueryBuilder
  // This allows us to control and track its functions (where, skip, take, etc.)
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          // Mock repository and make sure createQueryBuilder returns our mock
          useValue: createMock<Repository<User>>({
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          }),
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  // Clean up all mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Test suite for listUsers function ---
  describe('listUsers', () => {
    // --- Scenario 1: No parameters provided ---
    it('should apply default pagination and selection when no params are provided', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listUsers({});

      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'user.role',
        'role',
      );
      expect(mockQueryBuilder.where).not.toHaveBeenCalled(); // No filters applied
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0); // Default: (1 - 1) * 10
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10); // Default: 10
    });

    // --- Scenario 2: With search parameter ---
    it('should apply a WHERE clause for the search parameter', async () => {
      const dto: ListUserDto = { search: 'John Doe' };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listUsers(dto);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(user.name LIKE :search OR user.email LIKE :search)',
        { search: `%John Doe%` },
      );
    });

    // --- Scenario 3: With pagination parameters ---
    it('should handle pagination correctly', async () => {
      const dto: ListUserDto = { page: 3, limit: 20 };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.listUsers(dto);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(40); // (3 - 1) * 20
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    // --- Scenario 4: Verify returned result structure ---
    it('should return the correct paginated result structure', async () => {
      const mockUsers = [{ id: 1, name: 'Test User' }];
      const total = 50;
      const dto: ListUserDto = { page: 2, limit: 15 };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, total]);

      const result = await service.listUsers(dto);

      expect(result.data).toEqual(mockUsers);
      expect(result.total).toBe(total);
      expect(result.page).toBe(2);
      expect(result.last_page).toBe(4); // Math.ceil(50 / 15)
    });

    // --- Scenario 5: Handle errors from repository ---
    it('should throw an error if repository (query builder) fails', async () => {
      const dto: ListUserDto = { page: 1, limit: 10 };
      const error = new Error('Database connection failed');

      mockQueryBuilder.getManyAndCount.mockRejectedValue(error);

      await expect(service.listUsers(dto)).rejects.toThrow(error);
      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
    });
  });
});
