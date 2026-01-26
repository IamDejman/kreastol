"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg transition-colors min-h-touch min-w-touch active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          variant === "primary" &&
            "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark",
          variant === "secondary" &&
            "bg-white text-primary border-2 border-primary hover:bg-primary/5 active:bg-primary/10",
          variant === "ghost" &&
            "bg-transparent text-foreground hover:bg-gray-100 active:bg-gray-200",
          variant === "danger" &&
            "bg-danger text-white hover:bg-red-700 active:bg-red-800",
          size === "sm" && "px-4 py-2 text-sm",
          size === "md" && "px-6 py-3 text-base",
          size === "lg" && "px-8 py-4 text-lg",
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
