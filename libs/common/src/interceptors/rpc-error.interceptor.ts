import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RpcError } from '../constants/database.constants';

// Define a type for the structured RPC error

@Injectable()
export class RpcErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RpcErrorInterceptor.name);

  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error: unknown) => {
        this.logger.error('RpcErrorInterceptor caught error:', error);

        if (
          typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          'status' in error
        ) {
          const typedError = error as RpcError;
          return throwError(
            () => new HttpException(typedError.message, typedError.status),
          );
        }

        if (error instanceof RpcException) {
          const rpcError = error.getError();
          if (
            typeof rpcError === 'object' &&
            rpcError !== null &&
            'message' in rpcError &&
            'status' in rpcError
          ) {
            const typedError = rpcError as RpcError;
            return throwError(
              () => new HttpException(typedError.message, typedError.status),
            );
          }
        }

        return throwError(() => error);
      }),
    );
  }
}
