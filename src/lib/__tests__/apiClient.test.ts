import { apiDelete, apiFetch, apiGet, apiPatch, apiPost, ApiError } from "../apiClient";
import { resolveApiBase } from "../resolveApiBase";

describe("resolveApiBase", () => {
  const baseEnv: NodeJS.ProcessEnv = {
    NEXT_PUBLIC_AGENTPAY_API_BASE: undefined,
    NODE_ENV: "test",
  };

  it("falls back to the localhost default when the env var is unset", () => {
    expect(resolveApiBase({ env: baseEnv })).toBe("http://localhost:3001");
  });

  it("falls back when the env var is an empty string", () => {
    expect(
      resolveApiBase({
        env: {
          NEXT_PUBLIC_AGENTPAY_API_BASE: "",
          NODE_ENV: "test",
        } satisfies NodeJS.ProcessEnv,
      })
    ).toBe("http://localhost:3001");
  });

  it("falls back when the env var is whitespace only", () => {
    expect(
      resolveApiBase({
        env: {
          NEXT_PUBLIC_AGENTPAY_API_BASE: "   ",
          NODE_ENV: "test",
        } satisfies NodeJS.ProcessEnv,
      })
    ).toBe("http://localhost:3001");
  });

  it("returns the origin for an https origin-only base", () => {
    expect(
      resolveApiBase({
        env: {
          NEXT_PUBLIC_AGENTPAY_API_BASE: "https://api.example.com",
          NODE_ENV: "test",
        } satisfies NodeJS.ProcessEnv,
      })
    ).toBe("https://api.example.com");
  });

  it("strips a single trailing slash from the origin", () => {
    expect(
      resolveApiBase({
        env: {
          NEXT_PUBLIC_AGENTPAY_API_BASE: "https://api.example.com/",
          NODE_ENV: "test",
        } satisfies NodeJS.ProcessEnv,
      })
    ).toBe("https://api.example.com");
  });

  it("strips multiple trailing slashes", () => {
    expect(
      resolveApiBase({
        env: {
          NEXT_PUBLIC_AGENTPAY_API_BASE: "https://api.example.com///",
          NODE_ENV: "test",
        } satisfies NodeJS.ProcessEnv,
      })
    ).toBe("https://api.example.com");
  });

  it("preserves a base path while stripping trailing slashes", () => {
    expect(
      resolveApiBase({
        env: {
          NEXT_PUBLIC_AGENTPAY_API_BASE: "https://api.example.com/v1/",
          NODE_ENV: "test",
        } satisfies NodeJS.ProcessEnv,
      })
    ).toBe("https://api.example.com/v1");
  });

  it("trims surrounding whitespace from the env var", () => {
    expect(
      resolveApiBase({
        env: {
          NEXT_PUBLIC_AGENTPAY_API_BASE: "  https://api.example.com  ",
          NODE_ENV: "test",
        } satisfies NodeJS.ProcessEnv,
      })
    ).toBe("https://api.example.com");
  });

  it("allows http://localhost without warning", () => {
    const warn = jest.fn();
    expect(
      resolveApiBase({
        env: {
          NEXT_PUBLIC_AGENTPAY_API_BASE: "http://localhost:3001",
          NODE_ENV: "test",
        } satisfies NodeJS.ProcessEnv,
        warn,
      })
    ).toBe("http://localhost:3001");
    expect(warn).not.toHaveBeenCalled();
  });

  it("allows http on 127.0.0.1 without warning", () => {
    const warn = jest.fn();
    expect(
      resolveApiBase({
        env: {
          NEXT_PUBLIC_AGENTPAY_API_BASE: "http://127.0.0.1:4000",
          NODE_ENV: "test",
        } satisfies NodeJS.ProcessEnv,
        warn,
      })
    ).toBe("http://127.0.0.1:4000");
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns (dev) but still returns http on a non-localhost host", () => {
    const warn = jest.fn();
    expect(
      resolveApiBase({
        env: {
          NEXT_PUBLIC_AGENTPAY_API_BASE: "http://api.example.com",
          NODE_ENV: "test",
        } satisfies NodeJS.ProcessEnv,
        warn,
      })
    ).toBe("http://api.example.com");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/https/);
  });

  it("refuses http on non-localhost in production", () => {
    expect(() =>
      resolveApiBase({
        env: {
          NEXT_PUBLIC_AGENTPAY_API_BASE: "http://api.example.com",
          NODE_ENV: "production",
        } satisfies NodeJS.ProcessEnv,
        isProduction: true,
      })
    ).toThrow(/non-https.*production/i);
  });

  it("refuses to parse garbage", () => {
    expect(() =>
      resolveApiBase({
        env: {
          NEXT_PUBLIC_AGENTPAY_API_BASE: "not-a-url",
          NODE_ENV: "test",
        } satisfies NodeJS.ProcessEnv,
      })
    ).toThrow(/Invalid NEXT_PUBLIC_AGENTPAY_API_BASE/);
  });

  it("refuses unsupported protocols (e.g. ftp:)", () => {
    expect(() =>
      resolveApiBase({
        env: {
          NEXT_PUBLIC_AGENTPAY_API_BASE: "ftp://api.example.com",
          NODE_ENV: "test",
        } satisfies NodeJS.ProcessEnv,
      })
    ).toThrow(/Unsupported protocol/);
  });
});

describe("apiFetch", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function mockFetch(
    impl: jest.Mock | ((url: string, init?: RequestInit) => Promise<Response>)
  ) {
    global.fetch = impl as unknown as typeof fetch;
  }

  it("sends a JSON GET and returns the parsed body on success", async () => {
    mockFetch(
      jest.fn(async (url, init) => {
        expect(url).toMatch(/^http:\/\/localhost:3001\/api\/v1\/things/);
        expect(init?.method).toBeUndefined();
        expect((init?.headers as Record<string, string>)["Content-Type"]).toBe(
          "application/json"
        );
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      })
    );
    const body = await apiGet<{ ok: boolean }>("/api/v1/things");
    expect(body).toEqual({ ok: true });
  });

  it("serialises POST bodies as JSON and forwards the method", async () => {
    mockFetch(
      jest.fn(async (_url, init) => {
        expect(init?.method).toBe("POST");
        expect(init?.body).toBe(JSON.stringify({ hello: "world" }));
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      })
    );
    const body = await apiPost<{ ok: boolean }>("/api/v1/things", {
      hello: "world",
    });
    expect(body).toEqual({ ok: true });
  });

  it("forwards PATCH and DELETE verbs", async () => {
    const calls: Array<{ method?: string }> = [];
    mockFetch(
      jest.fn(async (_url, init) => {
        calls.push({ method: init?.method });
        return new Response("{}", { status: 200 });
      })
    );
    await apiPatch("/api/v1/things/1", { on: true });
    await apiDelete("/api/v1/things/1");
    expect(calls.map((c) => c.method)).toEqual(["PATCH", "DELETE"]);
  });

  it("merges caller headers with the default Content-Type", async () => {
    mockFetch(
      jest.fn(async (_url, init) => {
        const h = init?.headers as Record<string, string>;
        expect(h["Content-Type"]).toBe("application/json");
        expect(h["X-Request-Id"]).toBe("abc");
        return new Response("{}", { status: 200 });
      })
    );
    await apiFetch("/api/v1/x", {
      headers: { "X-Request-Id": "abc" },
    });
  });

  it("returns undefined for 204 No Content", async () => {
    mockFetch(
      jest.fn(async () => new Response(null, { status: 204 }))
    );
    const body = await apiDelete("/api/v1/x");
    expect(body).toBeUndefined();
  });

  it("throws an ApiError with the backend message when response is not ok", async () => {
    mockFetch(
      jest.fn(async () =>
        new Response(
          JSON.stringify({ error: "not_found", message: "Nope", requestId: "r1" }),
          { status: 404 }
        )
      )
    );
    await expect(apiGet("/api/v1/things/1")).rejects.toMatchObject({
      message: "Nope",
      error: "not_found",
      requestId: "r1",
    } satisfies Partial<ApiError>);
  });

  it("wraps a thrown fetch rejection with the original error message", async () => {
    mockFetch(
      jest.fn(async () => {
        throw new Error("network down");
      })
    );
    await expect(apiGet("/api/v1/x")).rejects.toThrow(/network down/);
  });

  it("copies all ApiError fields onto the thrown Error object", async () => {
    mockFetch(
      jest.fn(async () =>
        new Response(
          JSON.stringify({
            error: "rate_limit",
            message: "Too many requests",
            requestId: "req-42",
          }),
          { status: 429 }
        )
      )
    );
    const caught = (await apiGet("/api/v1/x").catch((e) => e)) as Error;
    expect(caught).toBeInstanceOf(Error);
    expect(caught.message).toBe("Too many requests");
    const apiErr = caught as unknown as ApiError;
    expect(apiErr.error).toBe("rate_limit");
    expect(apiErr.requestId).toBe("req-42");
  });
});
