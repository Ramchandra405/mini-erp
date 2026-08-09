import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", children, ...props }, ref) => {
    return (
      <label className="block">
        {label && <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>}
        <select
          ref={ref}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 bg-white
            focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
            ${error ? "border-red-400" : "border-slate-300"} ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
      </label>
    );
  }
);
Select.displayName = "Select";
