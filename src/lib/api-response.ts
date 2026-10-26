import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors/app-error";
import { ErrorCode } from "./errors/error-codes";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    requestId?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export function apiSuccess<T>(data: T, status = 200, meta?: ApiSuccessResponse<T>["meta"]): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}

export function apiError(error: unknown, requestId?: string): NextResponse<ApiErrorResponse> {
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
      path: e.path,
    }));
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: error.errors[0]?.message || "Input validation failed.",
          details: formattedErrors,
          ...(requestId ? { requestId } : {}),
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(typeof error.details === "object" && error.details !== null ? { details: error.details } : {}),
          ...(requestId ? { requestId } : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle generic / unexpected internal errors (sanitized for production)
  const isDev = process.env.NODE_ENV === "development";
  const errorMessage = isDev && error instanceof Error ? error.message : "An unexpected internal server error occurred.";

  return NextResponse.json(
    {
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: errorMessage,
        ...(requestId && { requestId }),
      },
    },
    { status: 500 }
  );
}
