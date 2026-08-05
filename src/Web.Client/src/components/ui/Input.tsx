import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { clsx } from "clsx";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldWrapperProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              "h-11 w-full rounded-xl border-0 bg-slate-100 px-4 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 transition-colors",
              "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500",
              "dark:bg-slate-800/60 dark:text-slate-100 dark:ring-slate-700 dark:focus:ring-brand-500",
              icon && "pl-10",
              error && "ring-2 ring-rose-400 focus:ring-rose-500",
              className,
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="mt-1.5 text-xs font-medium text-rose-500">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldWrapperProps {}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={clsx(
            "w-full resize-none rounded-xl border-0 bg-slate-100 px-4 py-3 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 transition-colors",
            "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500",
            "dark:bg-slate-800/60 dark:text-slate-100 dark:ring-slate-700 dark:focus:ring-brand-500",
            error && "ring-2 ring-rose-400 focus:ring-rose-500",
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-xs font-medium text-rose-500">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
        ) : null}
      </div>
    );
  },
);

TextArea.displayName = "TextArea";
