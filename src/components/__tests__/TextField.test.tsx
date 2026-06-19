import { render, screen } from "@testing-library/react";
import { TextField } from "../TextField";

// Query through the accessible name (via <label htmlFor>) rather than
// screen.getByLabelText, so the tests don't depend on whether the label
// text is rendered as a direct text node or wrapped in a `<span>`.
const emailInput = () =>
  screen.getByRole("textbox", { name: /email/i }) as HTMLInputElement;

describe("TextField", () => {
  it("renders the label and associates it with the input via htmlFor + id", () => {
    render(<TextField label="Email" />);
    const input = emailInput();
    // The label htmlFor must match the input id so clicks / screen readers
    // focus the right control.
    expect(input.tagName).toBe("INPUT");
  });

  it("uses a caller-provided id when supplied", () => {
    render(<TextField label="Email" id="custom-email" />);
    const input = emailInput();
    expect(input).toHaveAttribute("id", "custom-email");
  });

  it("does not emit aria-describedby when neither description nor error are present", () => {
    render(<TextField label="Email" />);
    const input = emailInput();
    expect(input).not.toHaveAttribute("aria-describedby");
    // aria-invalid is always emitted so screen readers get a stable signal.
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  it("links description via aria-describedby and does not mark the input invalid", () => {
    render(<TextField label="Email" description="We never share it" />);
    const input = emailInput();
    expect(input).toHaveAttribute("aria-invalid", "false");
    const descId = input.getAttribute("aria-describedby");
    expect(descId).toBeTruthy();
    expect(screen.getByText("We never share it")).toHaveAttribute(
      "id",
      descId as string
    );
  });

  it("links error via aria-describedby, marks the input invalid, and announces via role=alert", () => {
    render(<TextField label="Email" error="Please enter a valid address" />);
    const input = emailInput();
    expect(input).toHaveAttribute("aria-invalid", "true");
    const errId = input.getAttribute("aria-describedby");
    expect(errId).toBeTruthy();
    const errorEl = screen.getByRole("alert");
    expect(errorEl).toHaveTextContent("Please enter a valid address");
    expect(errorEl).toHaveAttribute("id", errId as string);
  });

  it("links both description and error via a single space-joined aria-describedby", () => {
    render(
      <TextField
        label="Email"
        description="We never share it"
        error="Please enter a valid address"
      />
    );
    const input = emailInput();
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const ids = (describedBy as string).split(" ");
    expect(ids).toHaveLength(2);
    expect(screen.getByText("We never share it")).toHaveAttribute("id", ids[0]);
    expect(screen.getByText("Please enter a valid address")).toHaveAttribute(
      "id",
      ids[1]
    );
  });

  it("passes through additional input attributes (e.g. required, disabled, placeholder)", () => {
    render(
      <TextField
        label="Email"
        placeholder="you@example.com"
        required
        disabled
        type="email"
      />
    );
    const input = emailInput();
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("placeholder", "you@example.com");
    expect(input).toHaveAttribute("type", "email");
  });

  it("flips aria-invalid back to false when the error prop is later removed", () => {
    const { rerender } = render(<TextField label="Email" error="Bad" />);
    expect(emailInput()).toHaveAttribute("aria-invalid", "true");
    rerender(<TextField label="Email" />);
    expect(emailInput()).toHaveAttribute("aria-invalid", "false");
  });
});
