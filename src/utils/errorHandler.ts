import axios, { AxiosError } from "axios";

export type NormalizedError = {
  message: string;
  statusCode?: number;
  details?: Record<string, unknown> | null;
};

export const mapApiError = (error: unknown): NormalizedError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string } & Record<string, unknown>>;
    const statusCode = axiosError.response?.status;
    const message =
      axiosError.response?.data?.message ||
      axiosError.message ||
      "We ran into a server issue. Please try again.";

    return {
      message,
      statusCode,
      details: axiosError.response?.data ?? null,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "Something went wrong. Please try again." };
};

export const toHumanReadableError = (error: NormalizedError | null | undefined): string | null => {
  if (!error) {
    return null;
  }

  if (error.statusCode && error.statusCode >= 500) {
    return "Our servers are busy right now. Please try again in a bit.";
  }

  return error.message || "Unable to complete the request.";
};
