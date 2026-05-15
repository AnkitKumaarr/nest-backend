import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Handle throttler (429) as a first-class case
    if (exception instanceof ThrottlerException) {
      return response.status(HttpStatus.TOO_MANY_REQUESTS).json({
        success: false,
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests. Please slow down and try again later.',
        timestamp: new Date().toISOString(),
      });
    }

    if (!(exception instanceof HttpException)) {
      console.error('Unhandled exception:', exception);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const baseResponse: Record<string, unknown> = {
      success: false,
      statusCode: status,
      message:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || 'Internal server error',
      timestamp: new Date().toISOString(),
    };

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      if (responseObj.errorMsg) {
        baseResponse['errorMsg'] = responseObj.errorMsg;
      }
    }

    response.status(status).json(baseResponse);
  }
}
