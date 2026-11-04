import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crmHttp, CrmApiError } from "./client";
import { crmTokenStore } from "./token-store";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("crmHttp", () => {
  it("unwraps the { hasError, data } envelope", async () => {
    fetchMock.mockResolvedValue(json({ hasError: false, data: [{ id: 1 }] }));
    expect(await crmHttp.post("/Lead/List", {})).toEqual([{ id: 1 }]);
  });

  it("passes bare (non-envelope) bodies through", async () => {
    fetchMock.mockResolvedValue(json([{ id: 1 }]));
    expect(await crmHttp.post("/MasterValue/ActiveList", {})).toEqual([{ id: 1 }]);
  });

  it("throws CrmApiError when the envelope has hasError", async () => {
    fetchMock.mockResolvedValue(json({ hasError: true, message: "nope" }));
    await expect(crmHttp.post("/Customer/List", {})).rejects.toMatchObject({ name: "CrmApiError", message: "nope" });
  });

  it("sends the Bearer token, the proxy path and a JSON body", async () => {
    crmTokenStore.set("abc");
    fetchMock.mockResolvedValue(json({ hasError: false, data: null }));
    await crmHttp.post("/Lead/Get", 7);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/crm/Lead/Get");
    expect(init.headers.Authorization).toBe("Bearer abc");
    expect(init.body).toBe("7");
  });

  it("builds the query string and skips undefined values", async () => {
    fetchMock.mockResolvedValue(json({ hasError: false, data: null }));
    await crmHttp.get("/Email/Download", { id: 3, type: undefined, fileName: "a b" });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/crm/Email/Download?id=3&fileName=a+b");
  });

  it("refreshes once on 401, stores the new token and retries", async () => {
    crmTokenStore.set("old");
    fetchMock
      .mockResolvedValueOnce(json({ message: "Unauthorized" }, 401))
      .mockResolvedValueOnce(json({ hasError: false, data: { jwtToken: "new" } }))
      .mockResolvedValueOnce(json({ hasError: false, data: "ok" }));
    expect(await crmHttp.post("/Notification/List", {})).toBe("ok");
    expect(crmTokenStore.get()).toBe("new");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/crm/Accounts/refresh-token");
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe("Bearer new");
  });

  it("clears the token and throws when the refresh fails", async () => {
    crmTokenStore.set("old");
    fetchMock.mockResolvedValue(json({ message: "Unauthorized" }, 401));
    await expect(crmHttp.post("/Notification/List", {})).rejects.toBeInstanceOf(CrmApiError);
    expect(crmTokenStore.get()).toBeNull();
  });

  it("does not try to refresh without a token", async () => {
    fetchMock.mockResolvedValue(json({ message: "Unauthorized" }, 401));
    await expect(crmHttp.post("/Notification/List", {})).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
