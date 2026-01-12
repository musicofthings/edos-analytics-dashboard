import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-start justify-between transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300 group' : ''}`}
    >
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1 group-hover:text-blue-600 transition-colors">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </p>
        )}
      </div>
      {icon && <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">{icon}</div>}
    </div>
  );
};