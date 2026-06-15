import { ApiError } from "@/lib/api/client";

export function getApiErrorMessage(error: unknown, fallback = "Request failed"): string {
  if (error instanceof ApiError) {
    if (typeof error.data === "string" && error.data.trim()) {
      return error.data.split("\n")[0].trim();
    }
    if (error.data && typeof error.data === "object" && "message" in error.data) {
      return String((error.data as { message: unknown }).message);
    }
    if (error.data && typeof error.data === "object" && "title" in error.data) {
      return String((error.data as { title: unknown }).title);
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
