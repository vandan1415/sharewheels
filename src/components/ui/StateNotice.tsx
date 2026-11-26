import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';

interface StateNoticeProps {
  variant: 'empty' | 'loading' | 'error';
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function StateNotice({
  variant,
  title,
  description,
  icon,
  action,
  className = '',
}: StateNoticeProps) {
  const defaultIcon =
    variant === 'loading' ? (
      <Loader2 className="h-6 w-6 animate-spin text-[#C8A97E] mx-auto" />
    ) : variant === 'error' ? (
      <AlertTriangle className="h-6 w-6 text-red-400 mx-auto" />
    ) : (
      <Inbox className="h-6 w-6 text-[#C8A97E] mx-auto" />
    );

  const borderClass =
    variant === 'error'
      ? 'border-red-500/35 bg-red-950/15'
      : 'border-[#2A2A30] bg-[#111114]';

  return (
    <div
      className={`border ${borderClass} p-10 rounded-sm text-center space-y-3 ${className}`}
    >
      <div className="flex justify-center">{icon ?? defaultIcon}</div>
      <h2 className="font-display text-lg sm:text-xl font-medium text-[#F4F1EA]">
        {title}
      </h2>
      {description && (
        <p className="text-xs sm:text-sm text-[#8E8E98] max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="pt-2 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
