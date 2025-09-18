/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '@app/database';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { ListUserDto, CreateUserDto, UpdateUserDto } from '@app/common';
import { RpcException } from '@nestjs/microservices';
import { I18nService } from 'nestjs-i18n';
import { createMock } from '@golevelup/ts-jest';
import * as bcrypt from 'bcrypt';

// "Mock" the entire bcrypt library
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<User>>;

  // Create a "stand-in actor" for QueryBuilder
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
          useValue: createMock<Repository<User>>({
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          }),
        },
        {
          provide: I18nService,
          useValue: createMock<I18nService>(),
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Tests for 'listUsers' ---
  describe('listUsers', () => {
    it('should build a query with search and pagination', async () => {
      const dto: ListUserDto = { page: 2, limit: 15, search: 'test' };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.listUsers(dto);

      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(15); // (2 - 1) * 15
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(15);
    });

    it('should build a query without search if search is not provided', async () => {
      await service.listUsers({});
      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
    });
  });

  // --- Tests for 'create' ---
  describe('create', () => {
    const createUserDto = {
      name: 'New User',
      email: 'new@test.com',
      password: 'password123',
    } as CreateUserDto;
    const payload = { createUserDto, lang: 'en', imageUrl: null };

    it('should create and save a new user with a hashed password', async () => {
      userRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      userRepository.create.mockImplementation((dto) => dto as User);
      userRepository.save.mockResolvedValue({
        id: 1,
        ...createUserDto,
      } as User);

      const result = await service.create(payload);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashedPassword' }),
      );
      expect(result).toBeDefined();
    });

    it('should throw an RpcException if the user already exists', async () => {
      userRepository.findOne.mockResolvedValue({ id: 1 } as User);
      await expect(service.create(payload)).rejects.toThrow(RpcException);
    });
  });

  // --- Tests for 'updateUserInfo' ---
  describe('updateUserInfo', () => {
    const updateUserDto = { name: 'Updated Name' } as UpdateUserDto;
    it('should update user info if user is found', async () => {
      userRepository.findOneBy.mockResolvedValue({ id: 1 } as User);
      userRepository.update.mockResolvedValue({} as UpdateResult);

      await service.updateUserInfo(1, updateUserDto, 'en');

      expect(userRepository.update).toHaveBeenCalledWith(1, updateUserDto);
    });

    it('should throw an RpcException if user is not found', async () => {
      const updateUserDto = { name: 'Updated Name' } as UpdateUserDto;

      userRepository.update.mockResolvedValue({ affected: 0 } as UpdateResult);

      await expect(
        service.updateUserInfo(999, updateUserDto, 'en'),
      ).rejects.toThrow(RpcException);
    });
  });

  // --- Tests for 'deleteUser' ---
  describe('deleteUser', () => {
    it('should delete the user if found', async () => {
      const mockUser = { id: 1 } as User;
      userRepository.findOneBy.mockResolvedValue(mockUser);
      userRepository.delete.mockResolvedValue({} as DeleteResult);

      const result = await service.deleteUser(1, 'en');

      expect(userRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw an RpcException if user to delete is not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);
      await expect(service.deleteUser(999, 'en')).rejects.toThrow(RpcException);
    });
  });
});
