type ApiErrorDetail = {
  field?: string;
  message: string;
};

class ApiError extends Error {
  statusCode: number;
  data: null;
  success: boolean;
  errors: ApiErrorDetail[];

  constructor(
    statusCode: number,
    message = "Something Went Wrong",
    errors: ApiErrorDetail[] = [],
    stack = "",
  ) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = null;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      success: this.success,
      message: this.message,
      errors: this.errors,
    };
  }
}

export { ApiError };