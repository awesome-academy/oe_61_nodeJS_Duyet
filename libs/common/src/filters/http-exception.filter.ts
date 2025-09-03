import {
  Catch,
  RpcExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

// Define a type for the structured RPC error
interface RpcError {
  message: string;
  status: number;
}

@Catch(RpcException)
export class HttpExceptionFilter implements RpcExceptionFilter<RpcException> {
  catch(exception: RpcException): Observable<any> {
    const error = exception.getError();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      'status' in error
    ) {
      const typedError = error as RpcError;
      statusCode = typedError.status;
      message = typedError.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    return throwError(() => new HttpException(message, statusCode));
  }
}
