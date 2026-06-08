import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex items-center justify-center p-4" id="shared-loading-spinner" role="presentation">
      <div 
        className={`${sizeClasses[size]} rounded-full border-[#2DD4BF] border-t-transparent animate-spin shadow-[0_0_15px_rgba(45,212,191,0.15)]`}
        role="status"
        aria-label="Loading audit registers"
      />
    </div>
  );
}
