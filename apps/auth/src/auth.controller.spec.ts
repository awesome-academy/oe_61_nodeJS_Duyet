/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  AdminLoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyTokenDto,
} from '@app/common';
import { RpcException } from '@nestjs/microservices';
import { ActiveUserDto } from '@app/common/dto/token-active.dto';
import { RegisterUserDto } from '@app/common/dto/register-user.dto';
import { validate } from 'class-validator';
import { UserLoginDto } from '@app/common/dto/user-login.dto';

// 1. Create a mock for the AuthService to isolate the controller
const mockAuthService = {
  adminLogin: jest.fn(),
  logout: jest.fn(),
  userRegister: jest.fn(),
  userActive: jest.fn(),
  userLogin: jest.fn(),
  userLogout: jest.fn(),
  googleLogin: jest.fn(),
  forgotPassword: jest.fn(),
  verifyResetToken: jest.fn(),
  resetPassword: jest.fn(),
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

    // Helper function to create DTO instances for validation tests
    const createAdminDto = (data: Partial<AdminLoginDto>): AdminLoginDto => {
      const dto = new AdminLoginDto();
      dto.email = data.email || '';
      dto.password = data.password || '';
      return dto;
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

    describe('for empty fields', () => {
      it('should fail validation if email is empty', async () => {
        const invalidData = createAdminDto({
          password: 'password123',
        });
        const errors = await validate(invalidData);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'email')).toBeTruthy();
      });

      it('should fail validation if password is empty', async () => {
        const invalidData = createAdminDto({
          email: 'admin@hotel.com',
        });
        const errors = await validate(invalidData);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'password')).toBeTruthy();
      });
    });

    it('should fail validation for an invalid email format', async () => {
      const invalidData = createAdminDto({
        email: 'invalid-email',
        password: 'password123',
      });
      const errors = await validate(invalidData);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBeTruthy();
    });

    it('should fail validation if password is shorter than 6 characters', async () => {
      const invalidData = createAdminDto({
        email: 'admin@hotel.com',
        password: '123',
      });
      const errors = await validate(invalidData);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBeTruthy();
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

    const createDto = (data: Partial<RegisterUserDto>): RegisterUserDto => {
      const dto = new RegisterUserDto();
      dto.name = data.name || '';
      dto.email = data.email || '';
      dto.password = data.password || '';
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
  describe('userLogin', () => {
    const userLoginPayload = {
      userLoginDto: {
        email: 'customer@hotel.com',
        password: 'password123',
      } as UserLoginDto,
      lang: 'vi',
    };

    // Helper function to create DTO instances for validation tests
    const createLoginDto = (data: Partial<UserLoginDto>): UserLoginDto => {
      const dto = new UserLoginDto();
      dto.email = data.email || '';
      dto.password = data.password || '';
      return dto;
    };

    // Business Logic Test: Successful login
    it('should call authService.userLogin and return success', async () => {
      const successResponse = {
        status: true,
        message: 'Đăng nhập thành công!',
        data: {
          accessToken: 'mockUserToken',
          user: {
            id: 2,
            email: 'customer@hotel.com',
            name: 'Customer User',
            role: 'customer',
            avatar: null,
          },
        },
      };
      mockAuthService.userLogin.mockResolvedValue(successResponse);

      const result = await controller.userLogin(userLoginPayload);

      expect(service.userLogin).toHaveBeenCalledWith(userLoginPayload);
      expect(result).toEqual(successResponse);
      expect(service.userLogin).toHaveBeenCalledTimes(1);
    });

    // Business Logic Test: Invalid credentials
    it('should propagate RpcException if credentials are wrong', async () => {
      const rpcError = new RpcException({
        message: 'Email hoặc mật khẩu không hợp lệ.',
        status: 401,
      });
      mockAuthService.userLogin.mockRejectedValue(rpcError);

      await expect(() =>
        controller.userLogin(userLoginPayload),
      ).rejects.toThrow(rpcError);
      expect(service.userLogin).toHaveBeenCalledTimes(1);
    });

    // Business Logic Test: Inactive account
    it('should propagate RpcException if account is inactive', async () => {
      const rpcError = new RpcException({
        message: 'Tài khoản của bạn đã bị vô hiệu hóa.',
        status: 401,
      });
      mockAuthService.userLogin.mockRejectedValue(rpcError);

      await expect(() =>
        controller.userLogin(userLoginPayload),
      ).rejects.toThrow(rpcError);
      expect(service.userLogin).toHaveBeenCalledTimes(1);
    });

    // --- Validation Tests ---

    describe('for empty fields', () => {
      it('should fail validation if email is empty', async () => {
        // This test covers the case where email is an empty string.
        const invalidData = createLoginDto({
          email: '', // Explicitly setting to empty string for clarity
          password: 'password123',
        });
        const errors = await validate(invalidData);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'email')).toBeTruthy();
      });

      it('should fail validation if password is empty', async () => {
        const invalidData = createLoginDto({
          email: 'customer@hotel.com',
          password: '', // Explicitly setting to empty string
        });
        const errors = await validate(invalidData);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'password')).toBeTruthy();
      });
    });

    it('should fail validation for an invalid email format', async () => {
      const invalidData = createLoginDto({
        email: 'invalid-email',
        password: 'password123',
      });
      const errors = await validate(invalidData);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBeTruthy();
    });

    it('should fail validation if password is shorter than 6 characters', async () => {
      const invalidData = createLoginDto({
        email: 'customer@hotel.com',
        password: '123',
      });
      const errors = await validate(invalidData);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBeTruthy();
    });
  });

  // Test suite for 'userLogout' ---
  describe('userLogout', () => {
    const logoutPayload: { token: string; lang: string } = {
      token: 'some-uuid',
      lang: 'vi',
    };

    it('should call authService.logout and return success', async () => {
      const successResponse = {
        status: true,
        message: 'Đăng xuất thành công.',
      };
      mockAuthService.logout.mockResolvedValue(successResponse);

      const result = await controller.userLogout(logoutPayload);

      expect(service.logout).toHaveBeenCalledWith(logoutPayload);
      expect(result).toEqual(successResponse);
    });

    // ADDED: Test case for failure
    it('should propagate RpcException if logout fails', async () => {
      const rpcError = new RpcException({
        message: 'Đăng xuất thất bại',
        status: 500,
      });
      mockAuthService.logout.mockRejectedValue(rpcError);

      await expect(controller.userLogout(logoutPayload)).rejects.toThrow(
        rpcError,
      );
    });
  });

  // Test suite for 'googleLogin' ---
  describe('googleLogin', () => {
    const googleLoginPayload = {
      email: 'google@user.com',
      lang: 'vi',
    };

    it('should call authService.googleLogin and return success', async () => {
      const successResponse = {
        status: true,
        data: { accessToken: 'googleAccessToken' },
      };
      mockAuthService.googleLogin.mockResolvedValue(successResponse);
      const result = await controller.googleLogin(googleLoginPayload);
      expect(service.googleLogin).toHaveBeenCalledWith(googleLoginPayload);
      expect(result).toEqual(successResponse);
    });

    // ADDED: Test case for failure
    it('should propagate RpcException if googleLogin fails', async () => {
      const rpcError = new RpcException({
        message: 'Account is inactive',
        status: 403,
      });
      mockAuthService.googleLogin.mockRejectedValue(rpcError);
      await expect(controller.googleLogin(googleLoginPayload)).rejects.toThrow(
        rpcError,
      );
    });
  });

  // --- Updated: Test suite for 'forgotPassword' ---
  describe('forgotPassword', () => {
    const forgotPasswordPayload = {
      forgotPasswordDto: { email: 'test@example.com' } as ForgotPasswordDto,
      lang: 'vi',
    };

    it('should call authService.forgotPassword and return success', async () => {
      const successResponse = { status: true, message: 'Yêu cầu đã được gửi.' };
      mockAuthService.forgotPassword.mockResolvedValue(successResponse);
      const result = await controller.forgotPassword(forgotPasswordPayload);
      expect(service.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordPayload,
      );
      expect(result).toEqual(successResponse);
    });

    // ADDED: Test case for failure
    it('should propagate RpcException if email is not found', async () => {
      const rpcError = new RpcException({
        message: 'Email không tồn tại trong hệ thống.',
        status: 404,
      });
      mockAuthService.forgotPassword.mockRejectedValue(rpcError);
      await expect(
        controller.forgotPassword(forgotPasswordPayload),
      ).rejects.toThrow(rpcError);
    });
  });

  // --- Updated: Test suite for 'verifyResetToken' ---
  describe('verifyResetToken', () => {
    const verifyTokenPayload = {
      verifyTokenDto: { token: 'valid-reset-token' } as VerifyTokenDto,
      lang: 'vi',
    };

    it('should call authService.verifyResetToken and return success', async () => {
      const successResponse = { status: true, message: 'Token hợp lệ.' };
      mockAuthService.verifyResetToken.mockResolvedValue(successResponse);
      const result = await controller.verifyResetToken(verifyTokenPayload);
      expect(service.verifyResetToken).toHaveBeenCalledWith(verifyTokenPayload);
      expect(result).toEqual(successResponse);
    });

    // ADDED: Test case for failure
    it('should propagate RpcException if token is invalid', async () => {
      const rpcError = new RpcException({
        message: 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
        status: 400,
      });
      mockAuthService.verifyResetToken.mockRejectedValue(rpcError);
      await expect(
        controller.verifyResetToken(verifyTokenPayload),
      ).rejects.toThrow(rpcError);
    });
  });

  // --- Updated: Test suite for 'resetPassword' ---
  describe('resetPassword', () => {
    const resetPasswordPayload = {
      resetPasswordDto: {
        token: 'valid-reset-token',
        password: 'newPassword123',
      } as ResetPasswordDto,
      lang: 'vi',
    };

    it('should call authService.resetPassword and return success', async () => {
      const successResponse = {
        status: true,
        message: 'Mật khẩu đã được đặt lại thành công.',
      };
      mockAuthService.resetPassword.mockResolvedValue(successResponse);
      const result = await controller.resetPassword(resetPasswordPayload);
      expect(service.resetPassword).toHaveBeenCalledWith(resetPasswordPayload);
      expect(result).toEqual(successResponse);
    });

    // ADDED: Test case for failure
    it('should propagate RpcException if token is invalid', async () => {
      const rpcError = new RpcException({
        message: 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
        status: 400,
      });
      mockAuthService.resetPassword.mockRejectedValue(rpcError);
      await expect(
        controller.resetPassword(resetPasswordPayload),
      ).rejects.toThrow(rpcError);
    });
  });
});
