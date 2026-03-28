import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const statusCode = context.switchToHttp().getResponse().statusCode;
        // Mutation response — service returned { message: '...' }
        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          Object.keys(data).length === 1
        ) {
          return { statusCode, success: true, message: data.message };
        }
        // Data response — return as-is under data key
        return { statusCode, success: true, data };
      }),
    );
  }
}
