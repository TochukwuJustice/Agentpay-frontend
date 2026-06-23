import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UsagePage from "./page";

describe("UsagePage", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("renders both Record and Query landmarks", () => {
    render(<UsagePage />);
    expect(screen.getByRole("heading", { name: /Usage metering/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Record usage/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Query usage/i })).toBeInTheDocument();
  });

  it("POSTs to /api/v1/usage and shows the new total on success", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ agent: "a", serviceId: "s", total: 42 }),
    } as unknown as Response);

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[0], { target: { value: "a" } });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
      target: { value: "s" },
    });
    fireEvent.change(screen.getByLabelText(/^Requests$/i), { target: { value: "42" } });
    fireEvent.click(screen.getByRole("button", { name: /Record/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/New total: 42/);
    });
  });

  it("surfaces a backend invalid_request as a role=alert", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "invalid_request", message: "boom" }),
    } as unknown as Response);

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[0], { target: { value: "a" } });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
      target: { value: "s" },
    });
    fireEvent.change(screen.getByLabelText(/^Requests$/i), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: /Record/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("boom");
    });
  });

  it("does not POST when requests parses to a non-integer", async () => {
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[0], { target: { value: "a" } });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
      target: { value: "s" },
    });
    // 1.5 is a positive number but not an integer — the component's onRecord
    // guard should set an error and never call fetch. Submitting the form
    // directly bypasses any HTML5 number-input nuance in jsdom.
    const requestsInput = screen.getByLabelText(/^Requests$/i);
    fireEvent.change(requestsInput, { target: { value: "1.5" } });
    const form = requestsInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /requests must be a positive integer/
      );
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("shows busy state and disables submit while querying, and clears prior result", async () => {
    let resolveQuery: (value: unknown) => void;
    globalThis.fetch = jest.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        resolveQuery = resolve;
      });
    });

    render(<UsagePage />);

    // First query
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], { target: { value: "a" } });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[1], { target: { value: "s" } });
    
    const queryButton = screen.getByRole("button", { name: /Query/i });
    fireEvent.click(queryButton);

    // Verify busy state
    expect(queryButton).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/Querying…/i);

    // Resolve first query
    resolveQuery!({
      ok: true,
      json: async () => ({ agent: "a", serviceId: "s", total: 10 }),
    } as unknown as Response);

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/a \/ s: 10 request\(s\)/i);
    });

    // Start second query
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], { target: { value: "b" } });
    
    // Create new promise for second query
    let resolveQuery2: (value: unknown) => void;
    (globalThis.fetch as jest.Mock).mockImplementationOnce(() => {
      return new Promise((resolve) => {
        resolveQuery2 = resolve;
      });
    });

    fireEvent.click(queryButton);

    // Prior result should be cleared immediately
    expect(screen.queryByText(/10 request\(s\)/i)).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/Querying…/i);

    resolveQuery2!({
      ok: true,
      json: async () => ({ agent: "b", serviceId: "s", total: 20 }),
    } as unknown as Response);

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/b \/ s: 20 request\(s\)/i);
    });
  });

  it("shows query error after a prior success", async () => {
    render(<UsagePage />);

    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ agent: "a", serviceId: "s", total: 10 }),
    } as unknown as Response);

    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], { target: { value: "a" } });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[1], { target: { value: "s" } });
    fireEvent.click(screen.getByRole("button", { name: /Query/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/a \/ s: 10 request\(s\)/i);
    });

    // Now error
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Not found" }),
    } as unknown as Response);

    fireEvent.click(screen.getByRole("button", { name: /Query/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Not found/i);
    });
    // The previous success result should be gone
    expect(screen.queryByText(/10 request\(s\)/i)).not.toBeInTheDocument();
  });

  it("handles an empty/zero total", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ agent: "zero", serviceId: "s", total: 0 }),
    } as unknown as Response);

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], { target: { value: "zero" } });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[1], { target: { value: "s" } });
    fireEvent.click(screen.getByRole("button", { name: /Query/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/zero \/ s: 0 request\(s\)/i);
    });
  });

  it("shows busy state and blocks double-submit while recording", async () => {
    let resolveRecord: (value: unknown) => void;
    const mockFetch = jest.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        resolveRecord = resolve;
      });
    });
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[0], { target: { value: "a" } });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], { target: { value: "s" } });
    fireEvent.change(screen.getByLabelText(/^Requests$/i), { target: { value: "5" } });
    
    const recordButton = screen.getByRole("button", { name: /Record/i });
    
    // Using submit to verify the onRecord handler prevents multiple calls
    const form = screen.getByLabelText(/^Requests$/i).closest("form")!;
    fireEvent.submit(form);

    // Button should be disabled and show busy text
    expect(recordButton).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/Recording…/i);

    // Try submitting again
    fireEvent.submit(form);

    // Resolve the promise
    resolveRecord!({
      ok: true,
      json: async () => ({ total: 5 }),
    } as unknown as Response);

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/New total: 5/i);
    });

    // fetch should only have been called once despite the second submit
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(recordButton).not.toBeDisabled();
  });
});
