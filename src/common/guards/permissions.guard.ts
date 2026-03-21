import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    // Company admins (role === 'admin') bypass permission checks
    if (user?.role === 'admin') return true;

    const userPermissions: string[] = user?.permissions ?? [];
    const hasAll = required.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      throw new ForbiddenException({
        success: false,
        message: 'You do not have permission to perform this action',
        code: 'FORBIDDEN',
      });
    }

    return true;
  }
}
