import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] border text-sm font-semibold shadow-sm transition focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "border-[var(--primary)] bg-[image:var(--gradient-brand)] text-[var(--primary-foreground)] shadow-[var(--shadow-glow)] hover:border-[var(--accent-cyan)]",
        secondary:
          "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)]",
        ghost:
          "border-transparent bg-transparent text-[var(--secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
        danger: "border-[var(--danger)] bg-[var(--danger)] text-white hover:opacity-90"
      },
      size: {
        sm: "min-h-10 px-3.5 py-2",
        md: "min-h-11 px-4.5 py-2.5",
        lg: "min-h-12 px-6 py-3"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

export function Button({
  children,
  className,
  loading = false,
  variant,
  size,
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      aria-busy={loading}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
