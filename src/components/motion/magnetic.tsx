"use client";

import { type CSSProperties, type PropsWithChildren, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type MagneticProps = PropsWithChildren<{
  className?: string;
  strength?: number;
}>;

export function Magnetic({ children, className, strength = 0.16 }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>();

  return (
    <div
      ref={ref}
      className={cn("motion-magnetic", className)}
      onPointerLeave={() => setStyle(undefined)}
      onPointerMove={(event) => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return;
        }

        const bounds = ref.current?.getBoundingClientRect();

        if (!bounds) {
          return;
        }

        const x = (event.clientX - bounds.left - bounds.width / 2) * strength;
        const y = (event.clientY - bounds.top - bounds.height / 2) * strength;
        setStyle({ transform: `translate3d(${x}px, ${y}px, 0)` });
      }}
      style={style}
    >
      {children}
    </div>
  );
}
