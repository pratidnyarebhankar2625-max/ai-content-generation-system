export class ApiError extends Error {
  public code: string;
  public statusCode: number;

  constructor(message: string, code: string = 'INTERNAL_ERROR', statusCode: number = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle generic / unexpected errors
  console.error("Unhandled API Error:", error);
  return Response.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      },
    },
    { status: 500 }
  );
}
