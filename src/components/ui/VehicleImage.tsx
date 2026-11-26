import { useState } from 'react';
import { CarFront } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleImageProps {
  src?: string | null;
  alt: string;
  label?: string;
  className?: string;
}

export function VehicleImage({ src, alt, label, className }: VehicleImageProps) {
  const [errored, setErrored] = useState(false);

  if (!src || src.trim() === '' || errored) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'relative flex flex-col items-center justify-center bg-[#141417] text-[#8E8E98] border border-[#2A2A30]/70 p-4 text-center select-none',
          className
        )}
      >
        <div className="h-10 w-10 rounded-sm border border-[#2A2A30] bg-[#0A0A0B] flex items-center justify-center mb-3">
          <CarFront className="h-5 w-5 text-[#C8A97E]/75 stroke-[1.5]" />
        </div>
        <span className="font-display text-xs font-medium tracking-wide text-[#E8E4DC] line-clamp-1">
          {label || alt}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#8E8E98]">
          Photograph Pending
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErrored(true)}
      className={cn('object-cover', className)}
    />
  );
}
