import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  color?: 'default' | 'green' | 'red' | 'blue' | 'yellow';
  className?: string;
}

const colorClasses = {
  default: 'bg-gray-50 text-gray-700 border-gray-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  color = 'default', 
  className = '' 
}) => {
  return (
    <div className={`border rounded-lg p-3 ${colorClasses[color]} ${className}`}>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
};
