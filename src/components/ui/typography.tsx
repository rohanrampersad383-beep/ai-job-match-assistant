import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function DisplayText({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className={cn("type-display", className)} {...props} />;
}

export function HeadingText({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("type-heading", className)} {...props} />;
}

export function BodyText({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("type-body", className)} {...props} />;
}

export function CaptionText({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("type-caption", className)} {...props} />;
}
