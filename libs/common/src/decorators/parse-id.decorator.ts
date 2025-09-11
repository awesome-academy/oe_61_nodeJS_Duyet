import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { Request } from 'express'; // <-- 1. Import Request từ express

export const ParseId = createParamDecorator(
  (paramName: string, ctx: ExecutionContext) => {
    // 2. Lấy request và ép kiểu nó thành 'Request' của Express
    const request: Request = ctx.switchToHttp().getRequest();
    const value = request.params[paramName];
    const numericId = Number(value);

    if (isNaN(numericId)) {
      const i18n = I18nContext.current(ctx);
      // Sử dụng key dịch thuật sẽ tốt hơn ở đây, ví dụ: 'validation.INVALID_ID'
      const message =
        i18n?.t('common.invalid_id_format') || 'Invalid ID format';
      throw new BadRequestException(message);
    }

    return numericId;
  },
);
