import React from 'react';

const Button = ({ children, as: Component = 'button', variant = 'primary', className = '', wFull = false, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const widthClass = wFull ? 'w-full' : '';
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 glow-primary-hover",
    outline: "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800",
    ghost: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm"
  };

  return (
    <Component 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Button;
