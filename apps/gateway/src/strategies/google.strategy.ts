import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  Profile,
  StrategyOptionsWithRequest,
} from 'passport-google-oauth20';
import { AuthService } from '../../../auth/src/auth.service';
import googleOauthConfig from 'libs/config/google-oauth.config';
import { I18nService } from 'nestjs-i18n';
import { Request } from 'express';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    @Inject(googleOauthConfig.KEY)
    private googleConfiguration: ConfigType<typeof googleOauthConfig>,
    private authService: AuthService,
    private readonly i18n: I18nService,
  ) {
    super(<StrategyOptionsWithRequest>{
      clientID: googleConfiguration.clientID,
      clientSecret: googleConfiguration.clientSecret,
      callbackURL: googleConfiguration.callbackURL,
      scope: ['email', 'profile'],
      passReqToCallback: true, // This option requires 'req' to be the first parameter in validate()
    });
  }

  async validate(
    req: Request, // The request object must be the first parameter
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    const { displayName, emails, photos } = profile;

    const lang = req.headers['accept-language']?.split(',')[0] || 'vi';

    // A crucial check to ensure the email exists
    if (!emails || emails.length === 0 || !emails[0].value) {
      this.logger.error(
        `Google OAuth failed: Profile for ${displayName} does not contain an email address.`,
        profile,
      );
      const message = this.i18n.t('auth.NO_EMAIL_GOOGLE', { lang });
      throw new UnauthorizedException(message);
    }

    const user = await this.authService.validateOAuthUser({
      googleUser: {
        email: emails[0].value,
        name: displayName,
        avatar: photos?.[0]?.value || null,
      },
      lang,
    });

    return user;
  }
}
