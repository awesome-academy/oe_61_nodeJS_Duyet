/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { getQueueToken } from '@nestjs/bull';
import { User, Role } from '@app/database';
import { RpcException } from '@nestjs/microservices';
import {
  UserStatus,
  AdminLoginDto,
  RegisterUserDto,
  ForgotPasswordDto,
  VerifyTokenDto,
  ResetPasswordDto,
} from '@app/common';
import * as bcrypt from 'bcrypt';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { ActiveUserDto } from '@app/common/dto/token-active.dto';
import { UserLoginDto } from '@app/common/dto/user-login.dto';

// Mock the entire bcrypt library
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: DeepMocked<Repository<User>>;
  let jwtService: DeepMocked<JwtService>;
  let i18nService: DeepMocked<I18nService>;
  let cacheManager: DeepMocked<Cache>;
  let emailQueue: DeepMocked<Queue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: createMock<Repository<User>>(),
        },
        {
          provide: getRepositoryToken(Role),
          useValue: createMock<Repository<Role>>(),
        },
        { provide: JwtService, useValue: createMock<JwtService>() },
        { provide: I18nService, useValue: createMock<I18nService>() },
        { provide: CACHE_MANAGER, useValue: createMock<Cache>() },
        { provide: getQueueToken('emails'), useValue: createMock<Queue>() },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
    i18nService = module.get(I18nService);
    cacheManager = module.get(CACHE_MANAGER);
    emailQueue = module.get(getQueueToken('emails'));

    // Default mock for i18n to return the key itself for simplicity in assertions
    i18nService.t.mockImplementation((key: string): string => key);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Test Suite for adminLogin ---
  describe('adminLogin', () => {
    const payload = {
      adminLoginDto: {
        email: 'admin@test.com',
        password: 'password',
      } as AdminLoginDto,
      lang: 'en',
    };
    const mockAdmin = {
      id: 1,
      email: 'admin@test.com',
      password: 'hashedPassword',
      role: { name: 'admin' },
      status: UserStatus.ACTIVE,
    } as User;

    it('should return an access token for a valid admin', async () => {
      userRepository.findOne.mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mockAccessToken');

      const result = await service.adminLogin(payload);
      expect(result.data.accessToken).toBe('mockAccessToken');
    });

    it('should throw RpcException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.adminLogin(payload)).rejects.toThrow(RpcException);
    });

    it('should throw RpcException if password does not match', async () => {
      userRepository.findOne.mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.adminLogin(payload)).rejects.toThrow(RpcException);
    });

    it('should throw RpcException if user is not an admin', async () => {
      const notAdmin = { ...mockAdmin, role: { name: 'customer' } } as User;
      userRepository.findOne.mockResolvedValue(notAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(service.adminLogin(payload)).rejects.toThrow(RpcException);
    });

    it('should throw RpcException if user is inactive', async () => {
      const inactiveAdmin = { ...mockAdmin, status: UserStatus.INACTIVE };
      userRepository.findOne.mockResolvedValue(inactiveAdmin);
      await expect(service.adminLogin(payload)).rejects.toThrow(RpcException);
    });
  });

  // --- Test Suite for userRegister ---
  describe('userRegister', () => {
    const payload = {
      registerUserDto: {
        name: 'New User',
        email: 'new@test.com',
        password: 'password',
      } as RegisterUserDto,
      lang: 'en',
    };

    it('should create a user and add a welcome email job to the queue', async () => {
      userRepository.findOneBy.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      // Mocking the manager's findOneBy for the Role entity
      userRepository.manager.findOneBy = jest
        .fn()
        .mockResolvedValue({ id: 3, name: 'customer' } as Role);
      userRepository.create.mockImplementation(
        (dto: Partial<User>): User => dto as User,
      );
      userRepository.save.mockResolvedValue({
        id: 10,
        ...payload.registerUserDto,
      } as User);

      const result = await service.userRegister(payload);

      expect(result.status).toBe(true);
      expect(userRepository.save).toHaveBeenCalled();
      expect(emailQueue.add).toHaveBeenCalledWith(
        'send-welcome-email',
        expect.any(Object),
      );
    });

    it('should throw RpcException if email already exists', async () => {
      userRepository.findOneBy.mockResolvedValue({ id: 1 } as User);
      await expect(service.userRegister(payload)).rejects.toThrow(RpcException);
    });
  });

  // --- Test Suite for userActive ---
  describe('userActive', () => {
    const payload = {
      ActiveUserDto: { verification_token: 'valid-token' } as ActiveUserDto,
      lang: 'en',
    };
    const mockUser = {
      id: 1,
      status: UserStatus.INACTIVE,
      verification_token: 'valid-token',
    } as User;

    it('should activate a user and clear the verification token', async () => {
      // FIX: Ensure rate limit checks do not interfere with this happy path
      cacheManager.get.mockResolvedValue(null); // Simulate no block and no previous attempts
      userRepository.findOneBy.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        status: UserStatus.ACTIVE,
        verification_token: null,
      });

      const result = await service.userActive(payload);

      expect(result.status).toBe(true);
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: UserStatus.ACTIVE,
          verification_token: null,
        }),
      );
      expect(cacheManager.del).toHaveBeenCalledWith(
        `active_attempt_${payload.ActiveUserDto.verification_token}`,
      );
    });

    it('should throw RpcException for an invalid token and increment rate limit', async () => {
      cacheManager.get.mockResolvedValueOnce(null); // isBlocked check
      cacheManager.get.mockResolvedValueOnce(0); // get attempts
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(service.userActive(payload)).rejects.toThrow(RpcException);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `active_attempt_${payload.ActiveUserDto.verification_token}`,
        1,
        900,
      );
    });

    it('should throw RpcException if rate limit is exceeded', async () => {
      cacheManager.get.mockResolvedValue('true'); // Simulate user is blocked
      await expect(service.userActive(payload)).rejects.toThrow(RpcException);
      expect(userRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('should return a success message if user is already active', async () => {
      // FIX: Ensure rate limit checks do not interfere
      cacheManager.get.mockResolvedValue(null);
      const alreadyActiveUser = { ...mockUser, status: UserStatus.ACTIVE };
      userRepository.findOneBy.mockResolvedValue(alreadyActiveUser);

      const result = await service.userActive(payload);

      expect(result.message).toContain('ALREADY_ACTIVE');
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  // --- Test Suite for logout ---
  describe('logout', () => {
    it('should add the token jti to the blacklist', async () => {
      const token = 'valid.jwt.token';
      const decodedPayload = {
        jti: 'some-uuid',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      jwtService.decode.mockReturnValue(decodedPayload);

      await service.logout({ token, lang: 'en' });

      expect(cacheManager.set).toHaveBeenCalledWith(
        `blacklist_${decodedPayload.jti}`,
        'true',
        expect.any(Number),
      );
    });

    it('should return success if token is already expired', async () => {
      const token = 'expired.jwt.token';
      const decodedPayload = {
        jti: 'some-uuid',
        exp: Math.floor(Date.now() / 1000) - 10,
      };
      jwtService.decode.mockReturnValue(decodedPayload);

      const result = await service.logout({ token, lang: 'en' });
      expect(result.status).toBe(true);
      expect(cacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('userLogin', () => {
    const payload = {
      userLoginDto: {
        email: 'customer@test.com',
        password: 'password',
      } as UserLoginDto,
      lang: 'en',
    };
    const mockCustomer = {
      id: 2,
      email: 'customer@test.com',
      password: 'hashedPassword',
      role: { name: 'customer' },
      status: UserStatus.ACTIVE,
    } as User;

    it('should return an access token for a valid customer', async () => {
      userRepository.findOne.mockResolvedValue(mockCustomer);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mockCustomerAccessToken');

      const result = await service.userLogin(payload);
      expect(result.data.accessToken).toBe('mockCustomerAccessToken');
    });

    it('should throw RpcException if the user is an admin', async () => {
      const mockAdmin = { ...mockCustomer, role: { name: 'admin' } } as User;
      userRepository.findOne.mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.userLogin(payload)).rejects.toThrow(RpcException);
    });
  });

  describe('forgotPassword', () => {
    const payload = {
      forgotPasswordDto: { email: 'customer@test.com' } as ForgotPasswordDto,
      lang: 'en',
    };
    const mockUser = { id: 2, email: 'customer@test.com' } as User;

    it('should save a reset token and queue an email if user exists', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.forgotPassword(payload);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password_reset_token: expect.any(String) as unknown as string,
          password_reset_expires: expect.any(Date) as unknown as Date,
        }),
      );
      expect(emailQueue.add).toHaveBeenCalledWith(
        'send-reset-password-email',
        expect.any(Object),
      );
      expect(result.status).toBe(true);
    });

    it('should throw RpcException if user does not exist', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(service.forgotPassword(payload)).rejects.toThrow(
        RpcException,
      );

      expect(userRepository.save).not.toHaveBeenCalled();
      expect(emailQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('verifyResetToken', () => {
    const payload = {
      verifyTokenDto: { token: 'valid-token' } as VerifyTokenDto,
      lang: 'en',
    };

    it('should return success if token is valid and not expired', async () => {
      userRepository.findOne.mockResolvedValue({ id: 2 } as User);
      const result = await service.verifyResetToken(payload);
      expect(result.status).toBe(true);
    });

    it('should throw RpcException if token is invalid or expired', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.verifyResetToken(payload)).rejects.toThrow(
        RpcException,
      );
    });
  });

  // --- NEW TEST SUITE for resetPassword ---
  describe('resetPassword', () => {
    const payload = {
      resetPasswordDto: {
        token: 'valid-token',
        password: 'newPassword',
      } as ResetPasswordDto,
      lang: 'en',
    };
    const mockUser = { id: 2, password_reset_token: 'valid-token' } as User;

    it('should hash new password, clear reset token, and save the user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      const result = await service.resetPassword(payload);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'newHashedPassword',
          password_reset_token: null,
          password_reset_expires: null,
        }),
      );
      expect(result.status).toBe(true);
    });

    it('should throw RpcException if token is invalid or expired', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.resetPassword(payload)).rejects.toThrow(
        RpcException,
      );
    });
  });
});
