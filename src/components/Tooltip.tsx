"use client";

import { type KeyboardEvent, type ReactNode, useId, useState } from "react";

type Props = {
  label: ReactNode;
  children: ReactNode;
};

/**
 * Accessible tooltip implementing WCAG 2.1 SC 1.4.13 (Content on Hover or Focus):
 *
 * - Dismissible: pressing Escape hides the tooltip without moving focus off the
 *   trigger, so a keyboard user can clear obscuring content and stay in place.
 * - Hoverable: the pointer can travel from the trigger onto the tooltip content
 *   without it disappearing. The hover region is owned by the outer wrapper (not
 *   the trigger), `pointer-events-none` is gone, and a bottom padding bridge on
 *   the tooltip removes the dead gap above the trigger.
 * - Persistent: the tooltip stays visible until the pointer leaves the whole
 *   region, the trigger blurs, or Escape is pressed.
 */
export function Tooltip({ label, children }: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    // Dismissible: Escape hides the tooltip but leaves focus on the trigger.
    if (event.key === "Escape" && visible) {
      event.stopPropagation();
      setVisible(false);
    }
  };

  return (
    // Focus/hover handlers live on the wrapper so that moving the pointer across
    // the gap from the trigger into the tooltip body does not dismiss it.
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      onKeyDown={handleKeyDown}
    >
      <span aria-describedby={visible ? id : undefined}>{children}</span>
      {visible && (
        <span
          role="tooltip"
          id={id}
          className="absolute bottom-full left-1/2 -translate-x-1/2 pb-1"
        >
          <span className="block whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white shadow">
            {label}
          </span>
        </span>
      )}
    </span>
  );
}
