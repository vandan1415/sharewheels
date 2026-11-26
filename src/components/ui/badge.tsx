import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] rounded-sm',
  {
    variants: {
      variant: {
        default: 'border-[#2A2A30] bg-[#1A1A1F] text-[#E8E4DC]',
        champagne: 'border-[#C8A97E]/40 bg-[#C8A97E]/10 text-[#C8A97E]',
        outline: 'border-[#2A2A30] bg-transparent text-[#8E8E98]',
        prototype: 'border-[#2A2A30] bg-[#111114] text-[#8E8E98]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
