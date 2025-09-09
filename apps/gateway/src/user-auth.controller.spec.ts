/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UserAuthController } from './user-auth.controller';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { I18nContext } from 'nestjs-i18n';
import { User } from '@app/database';
import { Request } from 'express';
import { RegisterUserDto } from '@app/common/dto/register-user.dto';
import { ActiveUserDto } from '@app/common/dto/token-active.dto';

// 1. Mock the ClientProxy (our microservice client)
const mockAuthClient = {
  send: jest.fn(),
};

// 2. Create a robust mock for nestjs-i18n to prevent initialization errors
jest.mock('nestjs-i18n', () => ({
  I18nModule: {
    forRoot: jest.fn(() => ({
      module: 'I18nModule',
      providers: [],
      exports: [],
    })),
  },
  I18nContext: {
    current: jest.fn(),
  },
  AcceptLanguageResolver: jest.fn(),
  QueryResolver: jest.fn(),
}));

// Common response type for tests
type SuccessResponse = {
  status: boolean;
  message?: string;
  data?: unknown;
};

describe('UserAuthController', () => {
  let controller: UserAuthController;
  let client: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserAuthController],
      providers: [
        {
          provide: 'AUTH_SERVICE',
          useValue: mockAuthClient,
        },
      ],
    }).compile();

    controller = module.get<UserAuthController>(UserAuthController);
    client = module.get<ClientProxy>('AUTH_SERVICE');

    // Default mock for i18n to avoid errors in simple tests
    (I18nContext.current as jest.Mock).mockReturnValue({ lang: 'vi' });
  });

  // Clean up mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Test suite for the 'register' handler ---
  describe('register', () => {
    const registerUserDto: RegisterUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should send a "user_register" message with the correct payload and language', async () => {
      const successResponse: SuccessResponse = {
        status: true,
        message: 'Registration successful!',
      };
      (I18nContext.current as jest.Mock).mockReturnValue({ lang: 'en' });
      mockAuthClient.send.mockReturnValue(of(successResponse));

      const result$ = controller.register(registerUserDto);

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'user_register' },
        { registerUserDto, lang: 'en' },
      );

      const result = (await result$.toPromise()) as SuccessResponse;
      expect(result).toEqual(successResponse);
    });

    it('should propagate RpcException if service fails', async () => {
      const rpcError = new RpcException({
        message: 'Email already exists',
        status: 409,
      });
      mockAuthClient.send.mockReturnValue(throwError(() => rpcError));

      const result$ = controller.register(registerUserDto);

      await expect(result$.toPromise()).rejects.toThrow(rpcError);
    });
  });

  // --- Test suite for the 'active' handler ---
  describe('active', () => {
    const activeDto: ActiveUserDto = {
      verification_token: 'some-uuid-token',
    };

    it('should send a "user_active" message with the correct payload', async () => {
      const successResponse: SuccessResponse = {
        status: true,
        message: 'Activation successful!',
      };
      mockAuthClient.send.mockReturnValue(of(successResponse));

      const result$ = controller.active(activeDto);

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'user_active' },
        { ActiveUserDto: activeDto, lang: 'vi' },
      );

      const result = (await result$.toPromise()) as SuccessResponse;
      expect(result).toEqual(successResponse);
    });
  });

  // --- Test suite for the 'googleCallback' handler ---
  describe('googleCallback', () => {
    const mockUser = { id: 1, email: 'google@user.com' } as User;
    const mockRequest = { user: mockUser } as unknown as Request;

    it('should send a "google_login" message with the correct payload and return the result', async () => {
      const successResponse: SuccessResponse = {
        status: true,
        data: { accessToken: 'jwt-token' },
      };
      mockAuthClient.send.mockReturnValue(of(successResponse));

      const result$ = controller.googleCallback(mockRequest);

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'google_login' },
        { email: mockUser.email, lang: 'vi' },
      );

      const result = (await result$.toPromise()) as SuccessResponse;
      expect(result).toEqual(successResponse);
    });
  });
});
