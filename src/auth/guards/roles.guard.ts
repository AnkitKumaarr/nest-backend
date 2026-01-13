import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true; // If no roles are defined, allow access

    const { user } = context.switchToHttp().getRequest();
    
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`Access denied: requires ${requiredRoles.join(' or ')} role`);
    }
    
    return true;
  }
}