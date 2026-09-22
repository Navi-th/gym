import React from 'react';

export interface StatTileProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: string;
  onClick?: () => void;
  className?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  icon,
  value,
  label,
  trend,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[16px] p-4 border border-slate-100 shadow-sm flex flex-col justify-between h-32 transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-md active:scale-[0.98]' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
          {value}
        </div>
        <div className="text-xs font-medium text-slate-500 truncate mt-0.5">
          {label}
        </div>
      </div>
    </div>
  );
};
