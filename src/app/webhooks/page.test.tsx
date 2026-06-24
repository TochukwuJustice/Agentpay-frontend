import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WebhooksPage from "./page";

const mockItems = [
  { id: "wh_1", url: "https://example.com/hook", events: ["usage.recorded"], createdAt: 1700000000 },
];

function mockFetchSuccess() {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ items: mockItems }),
  } as unknown as Response);
}

function urlField() {
  return screen.getByRole("textbox", { name: /^url\b/i }) as HTMLInputElement;
}

function eventsField() {
  return screen.getByRole("textbox", {
    name: /events \(comma-separated\)/i,
  }) as HTMLInputElement;
}

function registerButton() {
  return screen.getByRole("button", { name: /^register$/i });
}

function postCalls(fetchMock: jest.Mock) {
  return fetchMock.mock.calls.filter(
    (c: unknown[]) => (c[1] as RequestInit | undefined)?.method === "POST"
  );
}

afterEach(() => jest.restoreAllMocks());

it("does not delete immediately when Remove is clicked", async () => {
  mockFetchSuccess();
  render(<WebhooksPage />);
  await screen.findByText("https://example.com/hook");
  const fetchMock = globalThis.fetch as jest.Mock;
  fetchMock.mockClear();

  fireEvent.click(screen.getByRole("button", { name: /^remove$/i }));
  expect(fetchMock).not.toHaveBeenCalled();
});

it("shows confirm dialog when Remove is clicked", async () => {
  mockFetchSuccess();
  render(<WebhooksPage />);
  await screen.findByText("https://example.com/hook");

  fireEvent.click(screen.getByRole("button", { name: /^remove$/i }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText(/remove webhook/i)).toBeInTheDocument();
});

it("cancels without deleting when Cancel is clicked", async () => {
  mockFetchSuccess();
  render(<WebhooksPage />);
  await screen.findByText("https://example.com/hook");
  const fetchMock = globalThis.fetch as jest.Mock;
  fetchMock.mockClear();

  fireEvent.click(screen.getByRole("button", { name: /^remove$/i }));
  fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("calls DELETE and closes dialog when confirmed", async () => {
  mockFetchSuccess();
  render(<WebhooksPage />);
  await screen.findByText("https://example.com/hook");

  // stub DELETE + reload
  (globalThis.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) } as unknown as Response)
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: [] }) } as unknown as Response);

  fireEvent.click(screen.getByRole("button", { name: /^remove$/i }));
  const confirmBtn = screen.getAllByRole("button", { name: /^remove$/i })[0];
  fireEvent.click(confirmBtn);

  await waitFor(() => {
    const calls = (globalThis.fetch as jest.Mock).mock.calls;
    expect(calls.some((c: string[]) => c[0].includes("/api/v1/webhooks/wh_1"))).toBe(true);
  });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

describe("URL validation", () => {
  it("rejects http:// URLs with a field error and does not submit", async () => {
    mockFetchSuccess();
    render(<WebhooksPage />);
    await screen.findByText("https://example.com/hook");
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockClear();

    fireEvent.change(urlField(), { target: { value: "http://example.com/hook" } });
    fireEvent.click(registerButton());

    expect(await screen.findByText(/enter a valid https:\/\/ url/i)).toBeInTheDocument();
    expect(urlField()).toHaveAttribute("aria-invalid", "true");
    expect(postCalls(fetchMock)).toHaveLength(0);
  });

  it("rejects javascript: URLs with a field error and does not submit", async () => {
    mockFetchSuccess();
    render(<WebhooksPage />);
    await screen.findByText("https://example.com/hook");
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockClear();

    fireEvent.change(urlField(), { target: { value: "javascript:alert(1)" } });
    fireEvent.click(registerButton());

    expect(await screen.findByText(/enter a valid https:\/\/ url/i)).toBeInTheDocument();
    expect(postCalls(fetchMock)).toHaveLength(0);
  });

  it("rejects malformed URLs with a field error and does not submit", async () => {
    mockFetchSuccess();
    render(<WebhooksPage />);
    await screen.findByText("https://example.com/hook");
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockClear();

    // Syntactically malformed values never reach our handler: the native
    // `type="url"` constraint blocks the submit first (required attributes
    // augment, not replace, our validation).
    fireEvent.change(urlField(), { target: { value: "not-a-url" } });
    fireEvent.click(registerButton());

    expect(urlField().checkValidity()).toBe(false);
    expect(urlField().validity.typeMismatch).toBe(true);
    expect(postCalls(fetchMock)).toHaveLength(0);
  });

  it("clears the URL error once the field is edited again", async () => {
    mockFetchSuccess();
    render(<WebhooksPage />);
    await screen.findByText("https://example.com/hook");

    fireEvent.change(urlField(), { target: { value: "http://example.com/hook" } });
    fireEvent.click(registerButton());
    expect(await screen.findByText(/enter a valid https:\/\/ url/i)).toBeInTheDocument();

    fireEvent.change(urlField(), { target: { value: "https://example.com/hook" } });
    expect(screen.queryByText(/enter a valid https:\/\/ url/i)).not.toBeInTheDocument();
    expect(urlField()).toHaveAttribute("aria-invalid", "false");
  });
});

describe("events normalisation", () => {
  it("blocks submit when events are whitespace-only after trimming", async () => {
    mockFetchSuccess();
    render(<WebhooksPage />);
    await screen.findByText("https://example.com/hook");
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockClear();

    fireEvent.change(urlField(), { target: { value: "https://example.com/hook" } });
    fireEvent.change(eventsField(), { target: { value: "   ,  ,," } });
    fireEvent.click(registerButton());

    expect(await screen.findByText(/enter at least one event name/i)).toBeInTheDocument();
    expect(eventsField()).toHaveAttribute("aria-invalid", "true");
    expect(postCalls(fetchMock)).toHaveLength(0);
  });

  it("blocks submit when the events field is an empty string via the required attribute", async () => {
    mockFetchSuccess();
    render(<WebhooksPage />);
    await screen.findByText("https://example.com/hook");
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockClear();

    fireEvent.change(urlField(), { target: { value: "https://example.com/hook" } });
    fireEvent.change(eventsField(), { target: { value: "" } });
    fireEvent.click(registerButton());

    // A fully empty value never reaches our handler: the `required`
    // attribute blocks the submit natively before our normalisation runs.
    expect(eventsField().checkValidity()).toBe(false);
    expect(eventsField().validity.valueMissing).toBe(true);
    expect(postCalls(fetchMock)).toHaveLength(0);
  });

  it("collapses duplicate event names, trims whitespace, and drops trailing commas before posting", async () => {
    mockFetchSuccess();
    render(<WebhooksPage />);
    await screen.findByText("https://example.com/hook");
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockClear();
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ id: "wh_2" }) } as unknown as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: mockItems }) } as unknown as Response);

    fireEvent.change(urlField(), { target: { value: "https://example.com/new-hook" } });
    fireEvent.change(eventsField(), {
      target: { value: " usage.recorded , usage.recorded ,usage.settled,, " },
    });
    fireEvent.click(registerButton());

    await waitFor(() => expect(postCalls(fetchMock)).toHaveLength(1));
    const [, init] = postCalls(fetchMock)[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({
      url: "https://example.com/new-hook",
      events: ["usage.recorded", "usage.settled"],
    });
  });

  it("submits a valid https URL with a normalised event list", async () => {
    mockFetchSuccess();
    render(<WebhooksPage />);
    await screen.findByText("https://example.com/hook");
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockClear();
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ id: "wh_2" }) } as unknown as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: mockItems }) } as unknown as Response);

    fireEvent.change(urlField(), { target: { value: "https://example.com/new-hook" } });
    fireEvent.change(eventsField(), { target: { value: "usage.recorded,usage.settled" } });
    fireEvent.click(registerButton());

    await waitFor(() => expect(postCalls(fetchMock)).toHaveLength(1));
    const [url, init] = postCalls(fetchMock)[0];
    expect(url).toContain("/api/v1/webhooks");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      url: "https://example.com/new-hook",
      events: ["usage.recorded", "usage.settled"],
    });
    await waitFor(() => expect(urlField().value).toBe(""));
  });

  it("clears the events error once the field is edited again", async () => {
    mockFetchSuccess();
    render(<WebhooksPage />);
    await screen.findByText("https://example.com/hook");

    fireEvent.change(urlField(), { target: { value: "https://example.com/hook" } });
    fireEvent.change(eventsField(), { target: { value: "  " } });
    fireEvent.click(registerButton());
    expect(await screen.findByText(/enter at least one event name/i)).toBeInTheDocument();

    fireEvent.change(eventsField(), { target: { value: "usage.recorded" } });
    expect(screen.queryByText(/enter at least one event name/i)).not.toBeInTheDocument();
    expect(eventsField()).toHaveAttribute("aria-invalid", "false");
  });
});

it("still allows removing a list item after a blocked submit", async () => {
  mockFetchSuccess();
  render(<WebhooksPage />);
  await screen.findByText("https://example.com/hook");

  fireEvent.change(urlField(), { target: { value: "http://bad" } });
  fireEvent.click(registerButton());
  expect(await screen.findByText(/enter a valid https:\/\/ url/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /^remove$/i }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

it("keeps the required attribute on both fields", async () => {
  mockFetchSuccess();
  render(<WebhooksPage />);
  await screen.findByText("https://example.com/hook");

  expect(urlField()).toBeRequired();
  expect(eventsField()).toBeRequired();
});
