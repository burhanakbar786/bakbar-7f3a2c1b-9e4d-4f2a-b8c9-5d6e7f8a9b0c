import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 * 
 * Protects routes by verifying JWT tokens in the Authorization header.
 * 
 * Security Flow:
 * 1. Extracts JWT from "Authorization: Bearer <token>" header
 * 2. Verifies token signature using JWT_SECRET
 * 3. Checks token expiration
 * 4. Decodes payload and attaches user to request object
 * 5. Rejects request if token is invalid/expired
 * 
 * Usage:
 * ```typescript
 * @Controller('tasks')
 * @UseGuards(JwtAuthGuard)  // All routes require valid JWT
 * export class TasksController { }
 * ```
 * 
 * How It Works:
 * - Extends Passport's AuthGuard with 'jwt' strategy
 * - Automatically invokes JwtStrategy.validate() on success
 * - Returns 401 Unauthorized on failure
 * 
 * @Injectable - Can be injected as dependency
 * @see JwtStrategy for token validation logic
 * @see AuthInterceptor (frontend) for token attachment
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // No additional logic needed - Passport handles everything
  // Strategy is defined in jwt.strategy.ts
}
