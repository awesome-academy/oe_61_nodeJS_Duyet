import { Test, TestingModule } from '@nestjs/testing';
import { AdminUserController } from './admin-user.controller';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { JwtAuthGuard, ListUserDto, RolesGuard } from '@app/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

// 1. Mock ClientProxy to control its behavior
const mockUserClient = {
  send: jest.fn(),
};

describe('AdminUserController', () => {
  let controller: AdminUserController;
  let client: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUserController],
      providers: [
        {
          provide: 'USER_SERVICE',
          useValue: mockUserClient,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminUserController>(AdminUserController);
    client = module.get<ClientProxy>('USER_SERVICE');
  });

  // Clean up all mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Test suite for handler 'listUsers' ---
  describe('listUsers', () => {
    const listUserDto: ListUserDto = {
      page: 1,
      limit: 10,
      search: 'test',
    };

    // --- Business Logic Tests ---
    it('should call the userClient with the correct payload and return the result', () => {
      const successResponse = {
        data: [{ id: 1, name: 'Test User' }],
        total: 1,
      };
      // Using jest.spyOn for more flexible mocking
      const sendSpy = jest
        .spyOn(client, 'send')
        .mockReturnValue(of(successResponse));

      const result = controller.listUsers(listUserDto);

      expect(sendSpy).toHaveBeenCalledWith({ cmd: 'list_users' }, listUserDto);
      result.subscribe((res) => {
        expect(res).toEqual(successResponse);
      });
    });

    it('should propagate any error thrown by the service', async () => {
      const rpcError = new RpcException('Database connection failed');
      const sendSpy = jest
        .spyOn(client, 'send')
        .mockReturnValue(throwError(() => rpcError));

      const result$ = controller.listUsers(listUserDto);

      await expect(() => result$.toPromise()).rejects.toThrow(rpcError);
      expect(sendSpy).toHaveBeenCalledTimes(1);
    });
  });

  // --- NEW: DTO Validation Tests ---
  describe('ListUserDto validation', () => {
    // Helper function to create DTO from plain object
    const createDto = (data: any): ListUserDto => {
      return plainToInstance(ListUserDto, data);
    };

    it('should pass validation with correct data', async () => {
      const dto = createDto({ page: '1', limit: '20', search: 'test' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation if page is not a number', async () => {
      const dto = createDto({ page: 'abc' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'page')).toBeTruthy();
    });

    it('should fail validation if limit is out of range', async () => {
      const dto = createDto({ limit: '200' }); // Max is 100
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'limit')).toBeTruthy();
    });

    it('should fail validation if search is not a string', async () => {
      const dto = createDto({ search: 123 }); // Must be a string
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'search')).toBeTruthy();
    });

    it('should pass validation if optional fields are missing', async () => {
      const dto = createDto({}); // No fields provided
      const errors = await validate(dto);
      expect(errors.length).toBe(0); // All fields are optional
    });
  });
});
