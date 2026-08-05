import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className, id, children, ...props }, ref) => {
    const selectId = id ?? props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              "h-11 w-full appearance-none rounded-xl border-0 bg-slate-100 px-4 pr-10 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-brand-500",
              "dark:bg-slate-800/60 dark:text-slate-100 dark:ring-slate-700",
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-slate-400" />
        </div>
      </div>
    );
  },
);

Select.displayName = "Select";
