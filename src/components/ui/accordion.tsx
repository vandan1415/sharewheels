import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccordionItemData {
  id: string;
  question: string;
  answer: string;
}

export function Accordion({ items }: { items: AccordionItemData[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="divide-y divide-[#2A2A30] border-y border-[#2A2A30]">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className="py-5">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 text-left cursor-pointer group"
            >
              <span className="font-display text-base md:text-lg font-medium text-[#F4F1EA] group-hover:text-[#C8A97E] transition-colors">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-[#8E8E98] transition-transform duration-200',
                  isOpen && 'rotate-180 text-[#C8A97E]'
                )}
              />
            </button>
            {isOpen && (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#8E8E98]">
                {item.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
