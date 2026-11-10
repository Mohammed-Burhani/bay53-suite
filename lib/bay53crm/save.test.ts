import { beforeEach, describe, expect, it, vi } from "vitest";
import { CrmApiError } from "./api";
import { tolerateNotification } from "./save";

const warning = vi.fn();
vi.mock("sonner", () => ({ toast: { warning: (...args: unknown[]) => warning(...args) } }));

describe("tolerateNotification", () => {
  beforeEach(() => warning.mockClear());

  it("returns the result and stays quiet when the save works", async () => {
    await expect(tolerateNotification(Promise.resolve("ok"))).resolves.toBe("ok");
    expect(warning).not.toHaveBeenCalled();
  });

  it("warns and resolves when the record was saved but the notification email failed", async () => {
    const failure = new CrmApiError(200, "Invalid domain token at offset 11");
    await expect(tolerateNotification(Promise.reject(failure))).resolves.toBeUndefined();
    expect(warning).toHaveBeenCalledOnce();
  });

  it("rethrows other API errors", async () => {
    const failure = new CrmApiError(200, "Title is required");
    await expect(tolerateNotification(Promise.reject(failure))).rejects.toBe(failure);
    expect(warning).not.toHaveBeenCalled();
  });
});
