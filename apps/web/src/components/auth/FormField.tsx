import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const FormField = forwardRef<HTMLInputElement, Props>(function FormField(
  { label, error, hint, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-xs font-bold uppercase tracking-wider text-atlas-black/80">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'rounded-xl border-2 border-atlas-black/10 bg-white px-4 py-3 text-base text-atlas-black',
          'transition-colors placeholder:text-atlas-black/30',
          'focus:border-atlas-coral focus:outline-none focus:ring-2 focus:ring-atlas-coral/20',
          'aria-[invalid=true]:border-atlas-danger aria-[invalid=true]:ring-atlas-danger/20',
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-sm font-medium text-atlas-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-atlas-black/50">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
