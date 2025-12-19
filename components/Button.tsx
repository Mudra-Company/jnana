
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-full tracking-wide";
  
  const variants = {
    primary: "bg-jnana-sage text-white hover:bg-jnana-sageDark hover:shadow-glow hover:-translate-y-0.5 shadow-sm border border-transparent dark:hover:bg-jnana-sageDark",
    secondary: "bg-jnana-powder/20 text-jnana-text hover:bg-jnana-powder/40 hover:-translate-y-0.5 dark:bg-jnana-powder/10 dark:text-gray-200 dark:hover:bg-jnana-powder/20",
    outline: "border-2 border-jnana-sage text-jnana-sage hover:bg-jnana-sage hover:text-white dark:border-jnana-sage/70 dark:text-jnana-sage/80 dark:hover:bg-jnana-sage/70 dark:hover:text-white",
    ghost: "text-jnana-text hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10",
  };

  const sizes = {
    sm: "px-4 py-1.5 text-xs uppercase",
    md: "px-8 py-3 text-sm",
    lg: "px-10 py-4 text-base",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};