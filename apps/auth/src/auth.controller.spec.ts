/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminLoginDto } from '@app/common';
import { RpcException } from '@nestjs/microservices';
import { ActiveUserDto } from '@app/common/dto/token-active.dto';
import { RegisterUserDto } from '@app/common/dto/register-user.dto';
import { validate } from 'class-validator';

// 1. Create a mock for the AuthService to isolate the controller
const mockAuthService = {
  adminLogin: jest.fn(),
  logout: jest.fn(),
  userRegister: jest.fn(),
  userActive: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  // Clean up mocks after each test to ensure isolation
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Test suite for the 'login' handler ---
  describe('login', () => {
    const loginPayload = {
      adminLoginDto: {
        email: 'admin@hotel.com',
        password: 'password123',
      } as AdminLoginDto,
      lang: 'vi',
    };

    // --- Scenario 1: Successful Login ---
    it('should return the success response when login is successful', async () => {
      const successResponse = {
        status: true,
        message: 'Đăng nhập thành công!',
        data: {
          accessToken: 'mockToken',
          user: {
            id: 1,
            email: 'admin@hotel.com',
            name: 'Admin User',
            role: 'admin',
            avatar: null,
          },
        },
      };
      mockAuthService.adminLogin.mockResolvedValue(successResponse);
      const result = await controller.login(loginPayload);
      expect(service.adminLogin).toHaveBeenCalledWith(loginPayload);
      expect(result).toEqual(successResponse);
    });

    // --- Scenario 2: Invalid Credentials ---
    it('should propagate RpcException for invalid credentials', async () => {
      const rpcError = new RpcException({
        message: 'Email hoặc mật khẩu không hợp lệ.',
        status: 401,
      });
      mockAuthService.adminLogin.mockRejectedValue(rpcError);

      await expect(async () => controller.login(loginPayload)).rejects.toThrow(
        rpcError,
      );
    });

    // --- Scenario 3: Inactive Account ---
    it('should propagate RpcException when the account is inactive', async () => {
      const rpcError = new RpcException({
        message: 'Tài khoản của bạn đã bị vô hiệu hóa.',
        status: 401,
      });
      mockAuthService.adminLogin.mockRejectedValue(rpcError);

      await expect(async () => controller.login(loginPayload)).rejects.toThrow(
        rpcError,
      );
    });

    // --- Scenario 4: User is not an Admin ---
    it('should propagate RpcException when the user is not an admin', async () => {
      const rpcError = new RpcException({
        message: 'Tài khoản không có quyền truy cập.',
        status: 403,
      });
      mockAuthService.adminLogin.mockRejectedValue(rpcError);

      await expect(async () => controller.login(loginPayload)).rejects.toThrow(
        rpcError,
      );
    });

    // --- Scenario 5: Unexpected System Error ---
    it('should propagate a generic error when authService fails unexpectedly', async () => {
      const genericError = new Error('Unexpected database error');
      mockAuthService.adminLogin.mockRejectedValue(genericError);

      await expect(async () => controller.login(loginPayload)).rejects.toThrow(
        genericError,
      );
    });
  });

  // --- Test suite for the 'logout' handler ---
  describe('logout', () => {
    const logoutPayload = {
      token: 'some.jwt.token',
      lang: 'vi',
    };

    // --- Scenario: Successful Logout ---
    it('should call authService.logout and return success', async () => {
      const successResponse = {
        status: true,
        message: 'Đăng xuất thành công.',
      };
      mockAuthService.logout.mockResolvedValue(successResponse);
      const result = await controller.logout(logoutPayload);
      expect(service.logout).toHaveBeenCalledWith(logoutPayload);
      expect(result).toEqual(successResponse);
    });

    // --- Scenario: Logout Fails ---
    it('should propagate RpcException if logout fails', async () => {
      const rpcError = new RpcException({
        message: 'Đăng xuất thất bại',
        status: 500,
      });
      mockAuthService.logout.mockRejectedValue(rpcError);

      await expect(async () =>
        controller.logout(logoutPayload),
      ).rejects.toThrow(rpcError);
    });
  });

  describe('register', () => {
    const registerPayload = {
      registerUserDto: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      } as RegisterUserDto,
      lang: 'vi',
    };

    const createDto = (data: any): RegisterUserDto => {
      const dto = new RegisterUserDto();
      dto.name = data.name;
      dto.email = data.email;
      dto.password = data.password;
      return dto;
    };

    it('should call authService.userRegister and return success', async () => {
      const successResponse = {
        status: true,
        message:
          'Đăng ký tài khoản thành công! Vui lòng kiểm tra email của bạn.',
      };
      mockAuthService.userRegister.mockResolvedValue(successResponse);

      const result = await controller.register(registerPayload);

      expect(service.userRegister).toHaveBeenCalledWith(registerPayload);
      expect(result).toEqual(successResponse);
      expect(service.userRegister).toHaveBeenCalledTimes(1);
    });

    it('should propagate RpcException if email already exists', async () => {
      const rpcError = new RpcException({
        message: 'Email này đã được sử dụng.',
        status: 409, // Conflict
      });
      mockAuthService.userRegister.mockRejectedValue(rpcError);

      await expect(() => controller.register(registerPayload)).rejects.toThrow(
        rpcError,
      );
      expect(service.userRegister).toHaveBeenCalledTimes(1);
    });

    // Scenario: Missing fields
    it('should fail if name is empty', async () => {
      const invalidData = createDto({
        name: '',
        email: 'test@example.com',
        password: 'password123',
      });
      const errors = await validate(invalidData);
      expect(errors.length).toBeGreaterThan(0);
      // Check for an error related to the 'name' property
      expect(errors.some((e) => e.property === 'name')).toBeTruthy();
    });

    it('should fail if email is empty', async () => {
      const invalidData = createDto({
        name: 'Test User',
        email: '',
        password: 'password123',
      });
      const errors = await validate(invalidData);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBeTruthy();
    });

    it('should fail if password is empty', async () => {
      const invalidData = createDto({
        name: 'Test User',
        email: 'test@example.com',
        password: '',
      });
      const errors = await validate(invalidData);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBeTruthy();
    });

    // Scenario: Invalid Email format
    it('should fail if email is not a valid email format', async () => {
      const invalidData = createDto({
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      });
      const errors = await validate(invalidData);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBeTruthy();
    });

    // Scenario: Invalid password length
    it('should fail if password is shorter than 6 characters', async () => {
      const invalidData = createDto({
        name: 'Test User',
        email: 'test@example.com',
        password: '123',
      });
      const errors = await validate(invalidData);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBeTruthy();
    });
  });

  describe('userActive', () => {
    const activePayload = {
      ActiveUserDto: {
        verification_token: 'valid-token',
      } as ActiveUserDto,
      lang: 'vi',
    };

    it('should call authService.userActive and return success', async () => {
      const successResponse = {
        status: true,
        message: 'Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay.',
      };
      mockAuthService.userActive.mockResolvedValue(successResponse);

      const result = await controller.active(activePayload);

      expect(service.userActive).toHaveBeenCalledWith(activePayload);
      expect(result).toEqual(successResponse);
    });

    it('should propagate RpcException for an invalid activation code', async () => {
      const rpcError = new RpcException({
        message: 'Mã kích hoạt không hợp lệ.',
        status: 400, // Bad Request
      });
      mockAuthService.userActive.mockRejectedValue(rpcError);

      await expect(() => controller.active(activePayload)).rejects.toThrow(
        rpcError,
      );
    });

    it('should return success if the account is already active', async () => {
      const alreadyActiveResponse = {
        status: true,
        message: 'Tài khoản của bạn đã được kích hoạt trước đó.',
      };
      mockAuthService.userActive.mockResolvedValue(alreadyActiveResponse);

      const result = await controller.active(activePayload);

      expect(result).toEqual(alreadyActiveResponse);
    });

    // --- Scenario: Missing token (empty value) ---
    it('should fail validation if verification_token is empty', async () => {
      const dto = new ActiveUserDto();
      dto.verification_token = ''; // Empty token
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      // Check for an error related to the 'verification_token' property
      expect(
        errors.some((e) => e.property === 'verification_token'),
      ).toBeTruthy();
    });

    // --- Scenario: Missing token (property not provided) ---
    it('should fail validation if verification_token property is missing', async () => {
      const dto = new ActiveUserDto();
      // Intentionally not assigning a value to verification_token
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(
        errors.some((e) => e.property === 'verification_token'),
      ).toBeTruthy();
    });
  });
});
