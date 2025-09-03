import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '@app/database';
import { AdminLoginDto, UserStatus } from '@app/common';
import { I18nService } from 'nestjs-i18n';
import { RpcException } from '@nestjs/microservices';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from '../../../libs/common/src/constants/database.constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly i18n: I18nService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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

      //const isPasswordMatching = await bcrypt.compare(password, admin.password);
      const isPasswordMatching = password === admin.password;
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

  async adminLogout(payload: { token: string; lang: string }) {
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
}
