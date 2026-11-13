import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    const variants = {
      primary: 'bg-brand-solid text-white hover:bg-brand-solid_hover shadow-xs',
      secondary: 'bg-primary text-secondary border border-primary hover:bg-primary_hover',
      danger: 'bg-error-solid text-white hover:bg-error-solid_hover',
      ghost: 'bg-transparent text-secondary hover:bg-secondary_hover',
    };

    return (
      <Comp
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
