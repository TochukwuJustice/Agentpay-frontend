import { render, screen } from "@testing-library/react";
import EventsPage from "./page";
import { apiGet } from "@/lib/apiClient";

jest.mock("@/lib/apiClient", () => ({
  apiGet: jest.fn(),
}));

const mockApiGet = apiGet as jest.MockedFunction<typeof apiGet>;

describe("EventsPage", () => {
  beforeEach(() => {
    mockApiGet.mockReset();
  });

  it("renders the shared loading status while fetching", () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));

    render(<EventsPage />);

    expect(mockApiGet).toHaveBeenCalledWith("/api/v1/events?limit=100");
    expect(screen.getByRole("status")).toHaveTextContent("Loading events");
  });

  it("renders events on success", async () => {
    mockApiGet.mockResolvedValue({
      items: [
        {
          id: "evt_1",
          ts: 1_700_000_000,
          type: "usage.recorded",
          payload: { serviceId: "svc_1" },
        },
      ],
    });

    render(<EventsPage />);

    expect(await screen.findByText("usage.recorded")).toBeInTheDocument();
    expect(screen.getByText(/svc_1/)).toBeInTheDocument();
  });

  it("renders an empty state when the API returns no events", async () => {
    mockApiGet.mockResolvedValue({ items: [] });

    render(<EventsPage />);

    expect(await screen.findByText("No events yet.")).toBeInTheDocument();
  });

  it("renders API errors as alerts", async () => {
    mockApiGet.mockRejectedValue(new Error("failed to load events"));

    render(<EventsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "failed to load events",
    );
  });
});
