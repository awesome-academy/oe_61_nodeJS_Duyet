import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '@app/database';
import {
  AdminLoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UserStatus,
  VerifyTokenDto,
} from '@app/common';
import { I18nService } from 'nestjs-i18n';
import { RpcException } from '@nestjs/microservices';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { v4 as uuidv4 } from 'uuid';
import {
  CUSTOMER_ID,
  JwtPayload,
  TOKEN_EXPIRES_HOURS,
} from '../../../libs/common/src/constants/database.constants';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from '@app/common/dto/register-user.dto';
import { ActiveUserDto } from '@app/common/dto/token-active.dto';
import { UserLoginDto } from '@app/common/dto/user-login.dto';
import { OAuthUserDto } from '@app/common/dto/oauth-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly i18n: I18nService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectQueue('emails') private readonly emailQueue: Queue,
  ) {}

  async adminLogin(payload: { adminLoginDto: AdminLoginDto; lang: string }) {
    const { adminLoginDto, lang } = payload;
    const { email, password } = adminLoginDto;

    try {
      this.logger.log(`Admin login attempt for email: ${email}`);

      const admin = await this.userRepository.findOne({
        where: { email },
        relations: ['role'],
      });
      // Check if user exists
      if (!admin) {
        this.logger.warn(`Login failed: User not found for email: ${email}`);
        throw new RpcException({
          message: this.i18n.t('auth.INVALID_CREDENTIALS', { lang }),
          status: 401,
        });
      }

      // Check if user has role and is admin
      if (!admin.role || admin.role.name !== 'admin') {
        this.logger.warn(`Login failed: User ${email} is not admin`);
        throw new RpcException({
          message: this.i18n.t('auth.INVALID_CREDENTIALS', { lang }),
          status: 401,
        });
      }

      // Check if user is active
      if (admin.status !== UserStatus.ACTIVE) {
        this.logger.warn(`Login failed: User ${email} is inactive`);
        throw new RpcException({
          message: this.i18n.t('auth.ACCOUNT_INACTIVE', { lang }),
          status: 401,
        });
      }

      const isPasswordMatching = await bcrypt.compare(password, admin.password);
      if (!isPasswordMatching) {
        this.logger.warn(`Login failed: Invalid password for email: ${email}`);
        throw new RpcException({
          message: this.i18n.t('auth.INVALID_CREDENTIALS', { lang }),
          status: 401,
        });
      }

      const jwtPayload = {
        sub: admin.id,
        email: admin.email,
        role: admin.role.name,
        name: admin.name,
        jti: uuidv4(),
      };
      const accessToken = this.jwtService.sign(jwtPayload);

      this.logger.log(`Admin login successful for email: ${email}`);
      return {
        status: true,
        message: this.i18n.t('auth.LOGIN_SUCCESS', { lang }),
        data: {
          accessToken,
          user: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role.name,
            avatar: admin.avatar,
          },
        },
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      this.logger.error(
        `Login error for email: ${email}`,
        (error as Error).stack,
      );

      let errorMessage = 'Đã xảy ra lỗi trong quá trình đăng nhập.';
      try {
        errorMessage = this.i18n.t('auth.LOGIN_ERROR', { lang });
      } catch (i18nError) {
        this.logger.warn(
          'i18n error for error message:',
          (i18nError as Error).message,
        );
      }

      throw new RpcException({
        message: errorMessage,
        status: 500,
      });
    }
  }

  async logout(payload: { token: string; lang: string }) {
    const { token, lang } = payload;

    try {
      const decoded: JwtPayload | null = this.jwtService.decode(token);
      if (!decoded || !decoded.jti || !decoded.exp) {
        throw new RpcException({
          message: 'Invalid token structure',
          status: 400,
        });
      }

      const timeToExpire = decoded.exp - Math.floor(Date.now() / 1000);
      if (timeToExpire <= 0) {
        this.logger.log(`Token with jti ${decoded.jti} has already expired.`);
        return {
          status: true,
          message: this.i18n.t('auth.LOGOUT_SUCCESS', { lang }),
        };
      }

      await this.cacheManager.set(
        `blacklist_${decoded.jti}`,
        'true',
        timeToExpire,
      );
      this.logger.log(`Token with jti ${decoded.jti} has been blacklisted.`);

      return {
        status: true,
        message: this.i18n.t('auth.LOGOUT_SUCCESS', { lang }),
      };
    } catch (error) {
      this.logger.error('Error during logout:', (error as Error).stack);
      throw new RpcException({
        message: this.i18n.t('auth.LOGOUT_FAILED', { lang }),
        status: 500,
      });
    }
  }

  async userRegister(payload: {
    registerUserDto: RegisterUserDto;
    lang: string;
  }) {
    const { registerUserDto, lang } = payload;
    const { email, name, password } = registerUserDto;

    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser) {
      throw new RpcException({
        message: this.i18n.t('auth.REGISTER.EMAIL_EXISTS', { lang }),
        status: 409, // Conflict
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();

    const newUser = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      role_id: CUSTOMER_ID, // User has default role
      status: UserStatus.INACTIVE,
      verification_token: verificationToken,
    });

    const savedUser = await this.userRepository.save(newUser);

    try {
      // IMPORTANT STEP: SUBMIT JOB TO QUEUE
      await this.emailQueue.add('send-welcome-email', {
        email: savedUser.email,
        name: savedUser.name,
        activationCode: verificationToken,
        lang: lang,
      });
      this.logger.log(
        `User registered and 'welcome email' job queued for: ${savedUser.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to add welcome email job to the queue for user ${savedUser.email}`,
        (error as Error).stack,
      );
    }

    return {
      status: true,
      message: this.i18n.t('auth.REGISTER.SUCCESS', { lang }),
    };
  }

  async userActive(payload: { ActiveUserDto: ActiveUserDto; lang: string }) {
    const { ActiveUserDto, lang } = payload;
    const { verification_token } = ActiveUserDto;

    // Keys for tracking attempts and blocking
    const attemptKey = `active_attempt_${verification_token}`;
    const blockKey = `active_block_${verification_token}`;

    // STEP 1: Check if the token is currently blocked
    const isBlocked = await this.cacheManager.get(blockKey);
    if (isBlocked) {
      this.logger.warn(
        `Blocked activation attempt for token: ${verification_token}`,
      );
      throw new RpcException({
        message: this.i18n.t('auth.ACTIVE.RATE_LIMIT_EXCEEDED', { lang }),
        status: 429, // Too Many Requests
      });
    }

    // STEP 2: Find user by verification token
    const user = await this.userRepository.findOneBy({ verification_token });

    // If token is invalid
    if (!user) {
      const currentAttempts = Number(
        (await this.cacheManager.get(attemptKey)) || 0,
      );
      const newAttempts = currentAttempts + 1;
      this.logger.debug(`Invalid token attempt. Count: ${newAttempts}`);

      // Increase counter with TTL (e.g., 15 minutes)
      await this.cacheManager.set(attemptKey, newAttempts, 900);

      // If attempts exceed limit, block the token
      if (newAttempts >= 5) {
        this.logger.warn(
          `Token ${verification_token} is now blocked for 15 minutes.`,
        );
        await this.cacheManager.set(blockKey, 'true', 900); // Block for 15 minutes
        await this.cacheManager.del(attemptKey); // Clear attempts
        throw new RpcException({
          message: this.i18n.t('auth.ACTIVE.RATE_LIMIT_EXCEEDED', { lang }),
          status: 429,
        });
      }

      throw new RpcException({
        message: this.i18n.t('auth.ACTIVE.INVALID_CODE', { lang }),
        status: 400, // Bad Request
      });
    }

    // STEP 3: If token is valid
    if (user.status === UserStatus.ACTIVE) {
      return {
        status: true,
        message: this.i18n.t('auth.ACTIVE.ALREADY_ACTIVE', { lang }),
      };
    }

    user.status = UserStatus.ACTIVE;
    user.verification_token = null;
    await this.userRepository.save(user);

    // On successful activation, clear attempts from cache
    await this.cacheManager.del(attemptKey);
    await this.cacheManager.del(blockKey);
    return {
      status: true,
      message: this.i18n.t('auth.ACTIVE.SUCCESS', { lang }),
    };
  }

  async userLogin(payload: { userLoginDto: UserLoginDto; lang: string }) {
    const { userLoginDto, lang } = payload;
    const { email, password } = userLoginDto;

    try {
      this.logger.log(`User login attempt for email: ${email}`);

      const user = await this.userRepository.findOne({
        where: { email },
        relations: ['role'],
      });
      // Check if user exists
      if (!user) {
        this.logger.warn(`Login failed: User not found for email: ${email}`);
        throw new RpcException({
          message: this.i18n.t('auth.INVALID_CREDENTIALS', { lang }),
          status: 401,
        });
      }

      if (!user.role || user.role?.name !== 'customer') {
        this.logger.warn(
          `Login failed for user (invalid credentials or not a customer): ${email}`,
        );
        throw new RpcException({
          message: this.i18n.t('auth.INVALID_CREDENTIALS', { lang }),
          status: 401,
        });
      }

      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        this.logger.warn(`Login failed: User ${email} is inactive`);
        throw new RpcException({
          message: this.i18n.t('auth.ACCOUNT_INACTIVE', { lang }),
          status: 401,
        });
      }

      const isPasswordMatching = await bcrypt.compare(password, user.password);
      if (!isPasswordMatching) {
        this.logger.warn(`Login failed: Invalid password for email: ${email}`);
        throw new RpcException({
          message: this.i18n.t('auth.INVALID_CREDENTIALS', { lang }),
          status: 401,
        });
      }

      const jwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role.name,
        name: user.name,
        jti: uuidv4(),
      };
      const accessToken = this.jwtService.sign(jwtPayload);

      this.logger.log(`User login successful for email: ${email}`);
      return {
        status: true,
        message: this.i18n.t('auth.LOGIN_SUCCESS', { lang }),
        data: {
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role.name,
            avatar: user.avatar,
          },
        },
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      this.logger.error(
        `Login error for email: ${email}`,
        (error as Error).stack,
      );

      let errorMessage: string;
      try {
        errorMessage = this.i18n.t('auth.LOGIN_ERROR', { lang });
      } catch (i18nError) {
        this.logger.warn(
          `Could not translate 'auth.LOGIN_ERROR' for lang '${lang}'. Falling back to default message.`,
          (i18nError as Error).message,
        );
        errorMessage = this.i18n.t('auth.FALLBACK_ERROR', { lang: 'vi' });
      }

      throw new RpcException({
        message: errorMessage,
        status: 500,
      });
    }
  }

  async validateOAuthUser(payload: {
    googleUser: OAuthUserDto;
    lang: string;
  }): Promise<User> {
    const { googleUser, lang } = payload;
    const user = await this.userRepository.findOneBy({
      email: googleUser.email,
    });
    const password = uuidv4();
    if (user) return user;
    const newUser = this.userRepository.create({
      email: googleUser.email,
      name: googleUser.name,
      avatar: googleUser.avatar,
      password: await bcrypt.hash(password, 10),
      role_id: CUSTOMER_ID, // Default role for OAuth users
      status: UserStatus.ACTIVE, // OAuth users are active by default
    });

    try {
      // IMPORTANT STEP: SUBMIT JOB TO QUEUE
      await this.emailQueue.add('send-pass-email', {
        email: newUser.email,
        name: newUser.name,
        password: password,
        lang: lang,
      });
      this.logger.log(
        `User registered and 'welcome email' job queued for: ${newUser.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to add welcome email job to the queue for user ${newUser.email}`,
        (error as Error).stack,
      );
    }

    // Save the new user to the database and return it
    return this.userRepository.save(newUser);
  }

  async googleLogin(payload: { email: string; lang: string }) {
    const { email, lang } = payload;

    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    if (!user) {
      throw new RpcException({
        message: this.i18n.t('auth.USER_NOT_FOUND', { lang }),
        status: 404,
      });
    } else if (user.status !== UserStatus.ACTIVE) {
      throw new RpcException({
        message: this.i18n.t('auth.ACCOUNT_INACTIVE', { lang }),
        status: 403,
      });
    }

    const jwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      name: user.name,
      jti: uuidv4(),
    };
    const accessToken = this.jwtService.sign(jwtPayload);

    return {
      status: true,
      message: this.i18n.t('auth.LOGIN_SUCCESS', { lang }),
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name,
          avatar: user.avatar,
        },
      },
    };
  }

  async forgotPassword(payload: {
    forgotPasswordDto: ForgotPasswordDto;
    lang: string;
  }) {
    const { forgotPasswordDto, lang } = payload;
    const { email } = forgotPasswordDto;
    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      this.logger.warn(
        `Forgot password attempt for non-existent email: ${email}`,
      );
      throw new RpcException({
        message: this.i18n.t('auth.EMAIL_NOT_FOUND', { lang }),
        status: 404,
      });
    }

    const resetToken = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + TOKEN_EXPIRES_HOURS); // Token expires in 1 hour.

    user.password_reset_token = resetToken;
    user.password_reset_expires = expires; // Assign to the new column.
    await this.userRepository.save(user);

    // Submit a job to the queue to send the email.
    try {
      await this.emailQueue.add('send-reset-password-email', {
        email: user.email,
        name: user.name,
        resetToken: resetToken,
        lang: lang,
      });
      this.logger.log(
        `'send-reset-password-email' job queued for: ${user.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to add reset password job to the queue for user ${user.email}`,
        (error as Error).stack,
      );
    }

    this.logger.log(`Forgot password request processed for email: ${email}`);
    return {
      status: true,
      message: this.i18n.t('auth.FORGOT_PASSWORD.SUCCESS', { lang }),
    };
  }

  // NEW METHOD: VERIFY TOKEN
  async verifyResetToken(payload: {
    verifyTokenDto: VerifyTokenDto;
    lang: string;
  }) {
    const { verifyTokenDto, lang } = payload;
    const { token } = verifyTokenDto;

    const user = await this.userRepository.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: MoreThan(new Date()), // Check if the token is not expired.
      },
    });

    if (!user) {
      throw new RpcException({
        message: this.i18n.t('auth.RESET_PASSWORD.INVALID_TOKEN', { lang }),
        status: 400,
      });
    }

    return {
      status: true,
      message: this.i18n.t('auth.VERIFY_TOKEN.SUCCESS', { lang }),
    };
  }

  // NEW METHOD: RESET PASSWORD
  async resetPassword(payload: {
    resetPasswordDto: ResetPasswordDto;
    lang: string;
  }) {
    const { resetPasswordDto, lang } = payload;
    const { token, password } = resetPasswordDto;

    // Re-validate the token one last time for security.
    const user = await this.userRepository.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: MoreThan(new Date()),
      },
    });
    if (!user) {
      throw new RpcException({
        message: this.i18n.t('auth.RESET_PASSWORD.INVALID_TOKEN', { lang }),
        status: 400,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.password_reset_token = null;
    user.password_reset_expires = null; // Also clear the expiry date.
    await this.userRepository.save(user);

    return {
      status: true,
      message: this.i18n.t('auth.RESET_PASSWORD.SUCCESS', { lang }),
    };
  }
}
