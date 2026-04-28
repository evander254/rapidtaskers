import React from 'react';

const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 glow-primary hover:glow-primary-hover transition-all-custom ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
