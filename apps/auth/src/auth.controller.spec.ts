import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminLoginDto } from '@app/common';
import { RpcException } from '@nestjs/microservices';

// 1. Create a mock for the AuthService to isolate the controller
const mockAuthService = {
  adminLogin: jest.fn(),
  adminLogout: jest.fn(),
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
    it('should call authService.adminLogout and return success', async () => {
      const successResponse = {
        status: true,
        message: 'Đăng xuất thành công.',
      };
      mockAuthService.adminLogout.mockResolvedValue(successResponse);
      const result = await controller.logout(logoutPayload);
      expect(service.adminLogout).toHaveBeenCalledWith(logoutPayload);
      expect(result).toEqual(successResponse);
    });

    // --- Scenario: Logout Fails ---
    it('should propagate RpcException if logout fails', async () => {
      const rpcError = new RpcException({
        message: 'Đăng xuất thất bại',
        status: 500,
      });
      mockAuthService.adminLogout.mockRejectedValue(rpcError);

      await expect(async () =>
        controller.logout(logoutPayload),
      ).rejects.toThrow(rpcError);
    });
  });
});
