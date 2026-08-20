import { NextRequest, NextResponse } from "next/server";

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, errors: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = Array.isArray(errors) ? errors : [errors];
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function sendSuccess(data: unknown, message?: string, status = 200) {
  return NextResponse.json(
    { success: true, data, message: message || undefined, errors: [] },
    { status }
  );
}

export function sendError(status: number, message: string, errors: string[] = []) {
  return NextResponse.json(
    { success: false, data: null, message, errors: Array.isArray(errors) ? errors : [errors] },
    { status }
  );
}

export function asyncHandler(
  fn: (req: NextRequest, context?: { params: Promise<Record<string, string>> }) => Promise<NextResponse | void>
) {
  return (req: NextRequest, context?: { params: Promise<Record<string, string>> }) =>
    Promise.resolve(fn(req, context)).then((result) => {
      if (result instanceof NextResponse) return result;
      return sendError(500, "Internal Server Error");
    }).catch((err: unknown) => {
      if (err instanceof ApiError) {
        return sendError(err.statusCode, err.message, err.errors);
      }
      console.error("[API Error]", err);
      return sendError(500, "Internal Server Error");
    });
}
