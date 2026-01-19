import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * JWT Authentication HTTP Interceptor
 * 
 * Automatically attaches JWT token to all outgoing HTTP requests.
 * This is the critical piece that enables JWT authentication in Angular.
 * 
 * How It Works:
 * 1. Intercepts every HTTP request before it's sent
 * 2. Retrieves JWT token from AuthService (stored in localStorage)
 * 3. Clones the request and adds "Authorization: Bearer <token>" header
 * 4. Forwards the modified request to the server
 * 
 * Security Features:
 * - Token is sent in Authorization header (NOT query params - XSS safe)
 * - Bearer token standard (RFC 6750)
 * - Only adds token if user is authenticated
 * - Works with all HTTP methods (GET, POST, PUT, DELETE)
 * 
 * Backend Verification:
 * - NestJS JwtAuthGuard extracts and verifies token
 * - Token signature validated using JWT_SECRET
 * - User payload decoded and attached to request
 * 
 * Configuration:
 * - Registered in app.config.ts as HTTP_INTERCEPTORS provider
 * - Applied globally to all HTTP requests
 * 
 * Example Request:
 * ```
 * GET /api/tasks HTTP/1.1
 * Host: localhost:3000
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * ```
 * 
 * @param req - The outgoing HTTP request
 * @param next - The next interceptor in the chain
 * @returns Observable of the HTTP response
 * 
 * @see AuthService.getToken() - Retrieves stored JWT
 * @see JwtAuthGuard (backend) - Verifies token on server
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Inject AuthService to access stored token
  const authService = inject(AuthService);
  
  // Retrieve JWT from localStorage via AuthService
  const token = authService.getToken();

  // Only modify request if user is authenticated (has token)
  if (token) {
    // Clone request (immutable) and add Authorization header
    // Format: "Bearer <jwt_token>" per RFC 6750 standard
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`, // Critical: JWT sent with every API call
      },
    });
  }

  // Forward request to next interceptor or HTTP handler
  return next(req);
};
