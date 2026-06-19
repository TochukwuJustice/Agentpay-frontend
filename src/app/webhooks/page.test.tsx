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
