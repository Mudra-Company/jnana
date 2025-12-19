import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = 'md',
  onClick,
  ...props
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300' : '';

  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-3xl shadow-soft dark:shadow-none border border-white/50 dark:border-gray-700 ${paddings[padding]} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};