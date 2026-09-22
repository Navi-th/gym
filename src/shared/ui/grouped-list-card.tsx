import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface GroupedListItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
}

export interface GroupedListCardProps {
  title?: string;
  items: GroupedListItem[];
  className?: string;
}

export const GroupedListCard: React.FC<GroupedListCardProps> = ({
  title,
  items,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-slate-100 text-xs font-bold text-slate-900 uppercase tracking-wider">
          {title}
        </div>
      )}
      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={item.onClick}
            className={`px-5 py-4 flex items-center justify-between transition-colors ${
              item.onClick ? 'cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/80' : ''
            }`}
          >
            <div className="space-y-0.5 min-w-0 pr-3">
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-2 truncate">
                <span className="truncate">{item.title}</span>
                {item.badge}
              </div>
              {item.subtitle && (
                <div className="text-xs text-slate-500 truncate">{item.subtitle}</div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 shrink-0">
              {item.meta && <span>{item.meta}</span>}
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
