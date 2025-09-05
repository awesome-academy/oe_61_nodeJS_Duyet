import {
  Injectable,
  ValidationPipe,
  BadRequestException,
  ValidationError,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class I18nValidationPipe extends ValidationPipe {
  // 1. Create a static property to hold the I18nService instance
  public static i18n: I18nService;

  constructor(i18n: I18nService) {
    // 2. Assign the instance to the static property directly in the constructor
    I18nValidationPipe.i18n = i18n;

    // 3. Call the parent class constructor with a configured exceptionFactory
    super({
      exceptionFactory: (errors: ValidationError[]) => {
        // Now, exceptionFactory calls a static method,
        // so it no longer depends on 'this'.
        const formattedErrors = I18nValidationPipe.formatErrors(errors);
        return new BadRequestException({
          statusCode: 400,
          message: formattedErrors,
          error: 'Bad Request',
        });
      },
    });
  }

  // 4. Convert formatErrors into a static method
  private static formatErrors(errors: ValidationError[]) {
    return errors.map((error) => {
      // 5. Fix: Add '|| {}' to handle cases where 'constraints' may be undefined
      const messages = Object.values(error.constraints || {}).map((key) =>
        // Use the static property to access I18nService
        I18nValidationPipe.i18n.t(key, {
          args: {
            property: error.property,
            constraints: Object.values(error.constraints || {}),
          },
        }),
      );
      return {
        field: error.property,
        messages,
      };
    });
  }
}
