/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UserAuthController } from './user-auth.controller';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, of } from 'rxjs';
import { I18nContext } from 'nestjs-i18n';
import { User } from '@app/database';
import { Request } from 'express';
import {
  RegisterUserDto,
  JwtAuthGuard,
  ForgotPasswordDto,
  VerifyTokenDto,
  ResetPasswordDto,
  RpcErrorInterceptor,
} from '@app/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthGuard } from './google-auth/google-auth.guard';
import { ActiveUserDto } from '@app/common/dto/token-active.dto';
import { UserLoginDto } from '@app/common/dto/user-login.dto';
import { ExecutionContext } from '@nestjs/common';

// 1. Mock the ClientProxy
const mockAuthClient = {
  send: jest.fn(),
};

// 2. Mock I18nContext to prevent initialization errors
jest.mock('nestjs-i18n', () => ({
  I18nModule: { forRoot: jest.fn() },
  I18nContext: { current: jest.fn() },
}));

interface RequestWithUser extends Request {
  user: User;
}

describe('UserAuthController', () => {
  let controller: UserAuthController;
  let client: ClientProxy;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [UserAuthController],
      providers: [
        {
          provide: 'AUTH_SERVICE',
          useValue: mockAuthClient,
        },
        // Provide a mock for ConfigService
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        // Provide the Interceptor used by the controller
        RpcErrorInterceptor,
      ],
    })
      // Override Guards with simple mocks that always pass
      .overrideGuard(GoogleAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest<RequestWithUser>();
          req.user = {
            id: 1,
            email: 'test@google.com',
            name: 'Test Google User',
          } as User;
          return true;
        },
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserAuthController>(UserAuthController);
    client = module.get<ClientProxy>('AUTH_SERVICE');

    (I18nContext.current as jest.Mock).mockReturnValue({ lang: 'vi' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Test suite for 'register' ---
  describe('register', () => {
    it('should send "user_register" message with correct payload', () => {
      const dto = {} as RegisterUserDto;
      mockAuthClient.send.mockReturnValue(of({}));
      controller.register(dto);
      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'user_register' },
        { registerUserDto: dto, lang: 'vi' },
      );
    });
  });

  // --- Test suite for 'active' ---
  describe('active', () => {
    it('should send "user_active" message with correct payload', () => {
      const dto = {} as ActiveUserDto;
      mockAuthClient.send.mockReturnValue(of({}));
      controller.active(dto);
      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'user_active' },
        { ActiveUserDto: dto, lang: 'vi' },
      );
    });
  });

  // --- Test suite for 'login' ---
  describe('login', () => {
    it('should send "user_login" message with correct payload', () => {
      const dto = {} as UserLoginDto;
      mockAuthClient.send.mockReturnValue(of({}));
      controller.login(dto);
      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'user_login' },
        { userLoginDto: dto, lang: 'vi' },
      );
    });
  });

  // --- Test suite for 'logout' ---
  describe('logout', () => {
    it('should send "user_logout" message with token and lang', () => {
      const mockRequest = {
        headers: { authorization: 'Bearer test-token' },
      } as unknown as Request;
      mockAuthClient.send.mockReturnValue(of({}));
      controller.logout(mockRequest);
      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'user_logout' },
        { token: 'test-token', lang: 'vi' },
      );
    });
  });

  // --- Test suite for 'googleLogin' ---
  describe('googleLogin', () => {
    it('should do nothing and return undefined', () => {
      expect(controller.googleLogin()).toBeUndefined();
    });
  });

  // --- Test suite for 'googleCallback' ---
  describe('googleCallback', () => {
    it('should call auth service and redirect', async () => {
      const mockUser = { id: 1, email: 'google@user.com' } as User;
      const mockRequest = { user: mockUser } as RequestWithUser;
      const mockResult = { data: { accessToken: 'jwt-token' } };

      mockAuthClient.send.mockReturnValue(of(mockResult));
      await lastValueFrom(controller.googleCallback(mockRequest));

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'google_login' },
        { email: mockUser.email, lang: 'vi' },
      );
    });
  });

  // --- Test suite for 'forgotPassword' ---
  describe('forgotPassword', () => {
    it('should send "forgot_password" message with correct payload', () => {
      const dto = {} as ForgotPasswordDto;
      mockAuthClient.send.mockReturnValue(of({}));
      controller.forgotPassword(dto);
      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'forgot_password' },
        { forgotPasswordDto: dto, lang: 'vi' },
      );
    });
  });

  // --- Test suite for 'verifyToken' ---
  describe('verifyToken', () => {
    it('should send "verify_reset_token" message with correct payload', () => {
      const dto = {} as VerifyTokenDto;
      mockAuthClient.send.mockReturnValue(of({}));
      controller.verifyToken(dto);
      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'verify_reset_token' },
        { verifyTokenDto: dto, lang: 'vi' },
      );
    });
  });

  // --- Test suite for 'resetPassword' ---
  describe('resetPassword', () => {
    it('should send "reset_password" message with correct payload', () => {
      const dto = {} as ResetPasswordDto;
      mockAuthClient.send.mockReturnValue(of({}));
      controller.resetPassword(dto);
      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'reset_password' },
        { resetPasswordDto: dto, lang: 'vi' },
      );
    });
  });
});
