"use client";

import { cn } from "@/lib/utils/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "article" | "section";
}

export function Card({
  className,
  as: Component = "div",
  ...props
}: CardProps) {
  return <Component className={cn("card", className)} {...props} />;
}
