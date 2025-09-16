/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ListUserDto } from '@app/common';
import { RpcException } from '@nestjs/microservices';

// 1. Create a mock object (stand-in) for UserService
const mockUserService = {
  listUsers: jest.fn(),
};

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    // Reset mocks after each test to avoid state leaking between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    // Basic sanity check to ensure controller is correctly instantiated
    expect(controller).toBeDefined();
  });

  // --- Test suite for handler 'listUsers' ---
  describe('listUsers', () => {
    const listUserDto: ListUserDto = {
      page: 1,
      limit: 10,
      search: 'test',
    };

    // --- Scenario 1: Service returns successfully ---
    it('should call userService.listUsers with the correct payload and return the result', async () => {
      const successResponse = {
        data: [{ id: 1, name: 'Test User' }],
        total: 1,
        page: 1,
        last_page: 1,
      };

      // Mock service behavior
      mockUserService.listUsers.mockResolvedValue(successResponse);

      // Call controller
      const result = await controller.listUsers(listUserDto);

      // Assertions
      expect(service.listUsers).toHaveBeenCalledWith(listUserDto); // Ensure service was called with the right input
      expect(result).toEqual(successResponse); // Ensure controller returns service response as-is
    });

    // --- Scenario 2: Service throws an error ---
    it('should propagate any error thrown by the service', async () => {
      const rpcError = new RpcException('Database connection failed');

      // Mock service to throw error
      mockUserService.listUsers.mockRejectedValue(rpcError);

      // Controller should throw the same error
      await expect(controller.listUsers(listUserDto)).rejects.toThrow(rpcError);

      // Ensure service was called with correct payload
      expect(service.listUsers).toHaveBeenCalledWith(listUserDto);
    });
  });
});
