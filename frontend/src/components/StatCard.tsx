import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  trend?: string;
  trendPositive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  subtext,
  trend,
  trendPositive,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#075E54] flex items-center justify-center border border-emerald-100 shadow-2xs">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {(subtext || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs">
          {trend && (
            <span className={`font-bold mr-1.5 ${trendPositive ? 'text-emerald-700' : 'text-rose-600'}`}>
              {trend}
            </span>
          )}
          {subtext && <span className="text-slate-400 font-medium text-[11px]">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
