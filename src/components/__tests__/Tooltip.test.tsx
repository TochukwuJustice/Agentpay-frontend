import { act, fireEvent, render, screen } from "@testing-library/react";
import { Tooltip } from "../Tooltip";

const renderTooltip = () =>
  render(
    <Tooltip label="More info">
      <button type="button">Help</button>
    </Tooltip>
  );

// DOM shape: wrapper > [ describedBy-span > <button> ] + tooltip.
// The wrapper owns the hover/focus/keydown handlers, so it is the trigger's
// grandparent, and aria-describedby lives on the trigger's direct parent.
const getTrigger = () => screen.getByRole("button", { name: "Help" });
const describedBySpanOf = (trigger: HTMLElement) =>
  trigger.parentElement as HTMLElement;
const wrapperOf = (trigger: HTMLElement) =>
  trigger.parentElement?.parentElement as HTMLElement;

// Event choice note: React 17+ (this repo is React 19) delegates onFocus/onBlur
// through focusin/focusout and onMouseEnter/onMouseLeave through mouseover/
// mouseout. We therefore fire those native events (and use a real .focus() where
// document.activeElement matters) rather than fireEvent.focus / fireEvent.mouseEnter,
// which React does not subscribe to.

describe("Tooltip", () => {
  it("renders no tooltip and no description link until hovered or focused", () => {
    renderTooltip();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(describedBySpanOf(getTrigger())).not.toHaveAttribute(
      "aria-describedby"
    );
  });

  it("shows on focus and links aria-describedby to the tooltip (role + useId preserved)", () => {
    renderTooltip();
    const trigger = getTrigger();

    fireEvent.focusIn(trigger);

    const tip = screen.getByRole("tooltip");
    expect(tip).toHaveTextContent("More info");
    expect(tip.id).toBeTruthy();
    expect(describedBySpanOf(trigger)).toHaveAttribute(
      "aria-describedby",
      tip.id
    );
  });

  it("hides again when focus leaves the trigger (persistence: focus removed)", () => {
    renderTooltip();
    const trigger = getTrigger();

    fireEvent.focusIn(trigger);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.focusOut(trigger);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows on pointer enter and hides after the pointer leaves the whole region", () => {
    renderTooltip();
    const wrapper = wrapperOf(getTrigger());

    fireEvent.mouseOver(wrapper);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    // relatedTarget defaults outside the wrapper, so this is a real region exit.
    fireEvent.mouseOut(wrapper);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("stays visible while the pointer travels from the trigger into the tooltip (WCAG 1.4.13 hoverable)", () => {
    renderTooltip();
    const trigger = getTrigger();
    const wrapper = wrapperOf(trigger);

    fireEvent.mouseOver(wrapper);
    const tip = screen.getByRole("tooltip");

    // Pointer moves trigger -> tooltip. They share the wrapper as their common
    // ancestor, so the wrapper's onMouseLeave must NOT fire and the tooltip
    // must stay mounted.
    fireEvent.mouseOut(trigger, { relatedTarget: tip });
    fireEvent.mouseOver(tip, { relatedTarget: trigger });

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("dismisses on Escape while keeping focus on the trigger (WCAG 1.4.13 dismissible)", () => {
    renderTooltip();
    const trigger = getTrigger();

    act(() => {
      trigger.focus(); // sets document.activeElement and triggers React onFocus
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: "Escape" });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
