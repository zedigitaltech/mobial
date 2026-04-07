/**
 * @deprecated Prefer successResponse/errorResponse from '@/lib/auth-helpers' for consistency.
 * This file exists for backward compatibility with monitoring routes.
 */

/**
 * Standardized API Response Helper
 * Ensures consistent response format across all API routes
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Create a standardized JSON response
 */
export function createResponse<T>(
  data: T,
  options?: {
    message?: string;
    status?: number;
  }
): Response {
  return Response.json({
    success: true,
    data,
    message: options?.message,
  } as ApiResponse<T>, {
    status: options?.status ?? 200,
  });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  options?: {
    status?: number;
    data?: unknown;
  }
): Response {
  return Response.json({
    success: false,
    error,
    data: options?.data,
  } as ApiResponse<unknown>, {
    status: options?.status ?? 400,
  });
}

/**
 * Create a standardized auth error response
 */
export function createAuthErrorResponse(
  message: string = 'Authentication required',
  status: number = 401
): Response {
  return createErrorResponse(message, { status });
}

/**
 * Create a standardized forbidden error response
 */
export function createForbiddenResponse(
  message: string = 'Access denied'
): Response {
  return createErrorResponse(message, { status: 403 });
}

/**
 * Create a standardized not found error response
 */
export function createNotFoundResponse(
  message: string = 'Resource not found'
): Response {
  return createErrorResponse(message, { status: 404 });
}

/**
 * Create a standardized server error response
 */
export function createServerErrorResponse(
  message: string = 'An error occurred'
): Response {
  return createErrorResponse(message, { status: 500 });
}
