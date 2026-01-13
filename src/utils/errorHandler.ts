import axios, { AxiosError } from "axios";

export type NormalizedError = {
  message: string;
  statusCode?: number;
  details?: Record<string, unknown> | null;
};

/**
 * Normalize various error types into a consistent format
 */
export const mapApiError = (error: unknown): NormalizedError => {
  // Handle Axios errors (HTTP requests)
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string } & Record<string, unknown>>;
    const statusCode = axiosError.response?.status;

    // Try multiple sources for error message
    const message =
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      "We ran into a server issue. Please try again.";

    return {
      message,
      statusCode,
      details: axiosError.response?.data ?? null,
    };
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    return { message: error.message };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return { message: error };
  }

  // Handle already normalized error
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  ) {
    return error as NormalizedError;
  }

  // Handle unknown errors
  return { message: "Something went wrong. Please try again." };
};

/**
 * Convert normalized error to user-friendly message
 */
export const toHumanReadableError = (error: unknown): string => {
  // If error is null or undefined
  if (error === null || error === undefined) {
    return null;
  }

  // If error is a string, return as-is
  if (typeof error === 'string') {
    return error || "Unable to complete the request.";
  }

  // If error is a NormalizedError object
  if (typeof error === 'object' && 'message' in error) {
    const normalizedError = error as NormalizedError;

    // Server errors (5xx)
    if (normalizedError.statusCode && normalizedError.statusCode >= 500) {
      return "Our servers are busy right now. Please try again in a bit.";
    }

    // Return the message
    return normalizedError.message || "Unable to complete the request.";
  }

  // Fallback for any other type
  return "Unable to complete the request.";
};
