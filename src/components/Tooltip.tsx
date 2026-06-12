"use client";

import { type ReactNode, useId, useState } from "react";

type Props = {
  label: ReactNode;
  children: ReactNode;
};

export function Tooltip({ label, children }: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex">
      <span
        aria-describedby={visible ? id : undefined}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
      >
        {children}
      </span>
      {visible && (
        <span
          role="tooltip"
          id={id}
          className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white shadow"
        >
          {label}
        </span>
      )}
    </span>
  );
}
