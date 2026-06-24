import { render, screen } from "@testing-library/react";
import { StatTile } from "../StatTile";

describe("StatTile", () => {
  it("renders the label and value without a trend", () => {
    render(<StatTile label="Total Users" value="1,234" />);
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
    // No trend means no directional cue or text should be present
    expect(screen.queryByText(/up|down|unchanged/i)).not.toBeInTheDocument();
  });

  describe("with trend prop", () => {
    it("renders a positive trend correctly (default positiveIsGood: true)", () => {
      const { container } = render(
        <StatTile label="Revenue" value="$100" trend={{ delta: 15 }} />
      );
      
      // Screen reader text
      const srText = screen.getByText("up 15");
      expect(srText).toHaveClass("sr-only");

      // Visible text
      const visibleText = screen.getByText("▲ +15");
      expect(visibleText).toHaveAttribute("aria-hidden", "true");

      // Should have emerald color (good)
      const pTag = container.querySelector("p");
      expect(pTag).toHaveClass("text-emerald-700");
    });

    it("renders a negative trend correctly (default positiveIsGood: true)", () => {
      const { container } = render(
        <StatTile label="Churn" value="5%" trend={{ delta: -2 }} />
      );
      
      // Screen reader text
      const srText = screen.getByText("down 2");
      expect(srText).toHaveClass("sr-only");

      // Visible text
      const visibleText = screen.getByText("▼ -2");
      expect(visibleText).toHaveAttribute("aria-hidden", "true");

      // Should have rose color (bad)
      const pTag = container.querySelector("p");
      expect(pTag).toHaveClass("text-rose-700");
    });

    it("renders a zero trend correctly", () => {
      const { container } = render(
        <StatTile label="Active" value="42" trend={{ delta: 0 }} />
      );
      
      // Screen reader text
      const srText = screen.getByText("unchanged 0");
      expect(srText).toHaveClass("sr-only");

      // Visible text
      const visibleText = screen.getByText("— 0");
      expect(visibleText).toHaveAttribute("aria-hidden", "true");

      // With delta=0 and positiveIsGood=undefined (which defaults to true check),
      // it currently resolves to text-rose-700 per original logic: 
      // (0 > 0 ? true !== false : undefined === false) -> (false ? true : false) -> false -> rose
      const pTag = container.querySelector("p");
      expect(pTag).toHaveClass("text-rose-700");
    });

    it("flips colors when positiveIsGood is false for positive delta", () => {
      const { container } = render(
        <StatTile label="Errors" value="12" trend={{ delta: 5, positiveIsGood: false }} />
      );
      
      const srText = screen.getByText("up 5");
      expect(srText).toHaveClass("sr-only");
      
      // Positive delta but positiveIsGood is false means it's bad (rose)
      const pTag = container.querySelector("p");
      expect(pTag).toHaveClass("text-rose-700");
    });

    it("flips colors when positiveIsGood is false for negative delta", () => {
      const { container } = render(
        <StatTile label="Bugs" value="2" trend={{ delta: -3, positiveIsGood: false }} />
      );
      
      const srText = screen.getByText("down 3");
      expect(srText).toHaveClass("sr-only");
      
      // Negative delta but positiveIsGood is false means it's good (emerald)
      const pTag = container.querySelector("p");
      expect(pTag).toHaveClass("text-emerald-700");
    });

    it("evaluates zero trend to emerald when positiveIsGood is false", () => {
      const { container } = render(
        <StatTile label="Latency" value="20ms" trend={{ delta: 0, positiveIsGood: false }} />
      );
      
      const pTag = container.querySelector("p");
      // (0 > 0 ? false !== false : false === false) -> (false ? false : true) -> true -> emerald
      expect(pTag).toHaveClass("text-emerald-700");
    });
  });
});
