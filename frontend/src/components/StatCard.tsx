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
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-card hover:shadow-premium transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {(subtext || trend) && (
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center text-xs">
          {trend && (
            <span className={`font-semibold mr-1.5 ${trendPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend}
            </span>
          )}
          {subtext && <span className="text-gray-500">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
