import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '@turbovets/data';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Role-Based Authorization Guard
 * 
 * Enforces role requirements on controller methods.
 * Works in conjunction with @Roles() decorator.
 * 
 * Authorization Flow:
 * 1. Extract required roles from @Roles() decorator metadata
 * 2. Get authenticated user from request (attached by JwtAuthGuard)
 * 3. Check if user's role matches any required role
 * 4. Allow access if match found, deny otherwise
 * 
 * Usage Example:
 * ```typescript
 * @Post('tasks')
 * @UseGuards(JwtAuthGuard, RolesGuard)  // JWT first, then role check
 * @Roles(RoleName.ADMIN, RoleName.OWNER) // Only Admins and Owners
 * createTask() { }
 * ```
 * 
 * Role Hierarchy:
 * - Owner (Level 3): Full system access
 * - Admin (Level 2): Manage resources in own org
 * - Viewer (Level 1): Read-only access
 * 
 * @Injectable - Available for dependency injection
 * @see RolesDecorator for setting required roles
 * @see JwtAuthGuard for authentication (must run first)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Determines if the current user has permission to access the route.
   * 
   * @param context - Execution context containing request and metadata
   * @returns true if authorized, false otherwise
   * @throws ForbiddenException if user lacks required role
   */
  canActivate(context: ExecutionContext): boolean {
    // 1. Get required roles from @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),  // Method-level decorator
      context.getClass(),    // Class-level decorator
    ]);

    // 2. If no roles specified, allow access (public route)
    if (!requiredRoles) {
      return true;
    }

    // 3. Extract user from request (attached by JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // 4. Verify user exists and is authenticated
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // 5. Check if user's role matches any required role
    const hasRole = requiredRoles.some((role) => user.role?.name === role);

    // 6. Deny access if role doesn't match
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
