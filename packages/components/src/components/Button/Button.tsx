import { cn } from "@/utils";
import type { ButtonHTMLAttributes, Ref } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = ({
  className,
  variant = "primary",
  size = "md",
  loading,
  children,
  disabled,
  ref,
  ...props
}: ButtonProps & { ref?: Ref<HTMLButtonElement> }) => (
  <button
    className={cn(
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      {
        "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600":
          variant === "primary",
        "bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-200":
          variant === "secondary",
        "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600": variant === "danger",
        "px-2 py-1 text-sm": size === "sm",
        "px-4 py-2 text-base": size === "md",
        "px-6 py-3 text-lg": size === "lg",
      },
      className,
    )}
    disabled={loading || disabled}
    ref={ref}
    {...props}
  >
    {loading ? "加载中..." : children}
  </button>
);

Button.displayName = "Button";
