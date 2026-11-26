import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-medium tracking-[0.14em] uppercase transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C8A97E] disabled:pointer-events-none disabled:opacity-40 cursor-pointer rounded-sm',
  {
    variants: {
      variant: {
        primary:
          'bg-[#F4F1EA] text-[#0A0A0B] hover:bg-[#C8A97E] hover:text-[#0A0A0B]',
        champagne:
          'bg-[#C8A97E] text-[#0A0A0B] hover:bg-[#F4F1EA] hover:text-[#0A0A0B]',
        outline:
          'border border-[#2A2A30] bg-transparent text-[#F4F1EA] hover:border-[#C8A97E] hover:text-[#C8A97E]',
        ghost:
          'bg-transparent text-[#E8E4DC] hover:text-[#C8A97E] hover:bg-[#1A1A1F]/60',
      },
      size: {
        sm: 'h-9 px-4 text-[11px]',
        md: 'h-11 px-6 text-xs',
        lg: 'h-12 px-8 text-xs',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';
