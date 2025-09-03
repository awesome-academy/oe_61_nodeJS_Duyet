import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class RpcErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RpcErrorInterceptor.name);

  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof HttpException) {
          return throwError(() => error);
        }
        if (
          typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          'status' in error
        ) {
          const typedError = error as { message: string; status: number };
          return throwError(
            () => new HttpException(typedError.message, typedError.status),
          );
        }
        this.logger.error('Unknown error type caught by interceptor:', error);
        return throwError(
          () => new HttpException('Internal Server Error', 500),
        );
      }),
    );
  }
}
