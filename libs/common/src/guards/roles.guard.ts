import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestWithUser } from './jwt-auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get the list of required roles from the decorator @Roles('admin')
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If the API is not marked with @Roles, anyone can access it
    if (!requiredRoles) {
      return true;
    }

    // 2. Get user information (decoded and attached by JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest<RequestWithUser>();

    if (!user) {
      return false;
    }
    // 3. Compare user's role with required roles
    return requiredRoles.includes(user.role);
  }
}
