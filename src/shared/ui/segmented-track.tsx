import React from 'react';

export interface SegmentedTrackOption {
  id: string;
  label: string;
  count?: number;
}

export interface SegmentedTrackProps {
  options: SegmentedTrackOption[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}

export const SegmentedTrack: React.FC<SegmentedTrackProps> = ({
  options,
  activeId,
  onChange,
  ariaLabel = 'Segmented options',
  className = '',
}) => {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`h-12 bg-[#F0F1F5] p-1 rounded-full flex items-center gap-1 w-full sm:w-auto ${className}`}
    >
      {options.map((option) => {
        const isActive = option.id === activeId;
        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={`h-full flex-1 sm:flex-initial px-5 rounded-full flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-150 select-none ${
              isActive
                ? 'bg-[#C4FF00] text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
            }`}
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-slate-900/10 text-slate-900' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
