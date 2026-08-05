import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-glow hover:bg-brand-700 focus-visible:ring-brand-500 disabled:bg-brand-400",
  secondary:
    "bg-white text-slate-700 shadow-card ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:ring-brand-500 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700/70",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:bg-slate-800",
  outline:
    "bg-transparent text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100 focus-visible:ring-brand-500 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800",
  danger:
    "bg-rose-600 text-white shadow-card hover:bg-rose-700 focus-visible:ring-rose-500 disabled:bg-rose-400",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-9 w-9 justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled ?? isLoading}
        className={clsx(
          "inline-flex select-none items-center rounded-xl font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950",
          "disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
