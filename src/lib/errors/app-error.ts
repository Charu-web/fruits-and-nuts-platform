import { ErrorCode, HttpStatusMap } from "./error-codes";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, code: ErrorCode = ErrorCode.INTERNAL_ERROR, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = HttpStatusMap[code] || 500;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static validation(message: string, details?: unknown): AppError {
    return new AppError(message, ErrorCode.VALIDATION_ERROR, details);
  }

  static notFound(resource: string, identifier?: string | number): AppError {
    const msg = identifier ? `${resource} with identifier '${identifier}' was not found` : `${resource} not found`;
    return new AppError(msg, ErrorCode.NOT_FOUND);
  }

  static unauthorized(message = "Authentication required"): AppError {
    return new AppError(message, ErrorCode.AUTHENTICATION_ERROR);
  }

  static forbidden(message = "Access denied: insufficient permissions"): AppError {
    return new AppError(message, ErrorCode.AUTHORIZATION_ERROR);
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError(message, ErrorCode.CONFLICT, details);
  }

  static insufficientStock(message = "One or more items in your cart are out of stock"): AppError {
    return new AppError(message, ErrorCode.INSUFFICIENT_STOCK);
  }

  static database(message = "A database operation error occurred"): AppError {
    return new AppError(message, ErrorCode.DATABASE_ERROR);
  }

  static internal(message = "An unexpected error occurred"): AppError {
    return new AppError(message, ErrorCode.INTERNAL_ERROR);
  }

  static external(message: string, details?: unknown): AppError {
    return new AppError(message, ErrorCode.EXTERNAL_SERVICE_ERROR, details);
  }

  static serviceUnavailable(message = "Service temporarily unavailable"): AppError {
    return new AppError(message, ErrorCode.EXTERNAL_SERVICE_ERROR);
  }
}
