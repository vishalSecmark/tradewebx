import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface LoadingSpinnerProps {
  isLoading: boolean;
  loadingText?: string;
  spinnerSize?: number; // Optional size in pixels
  className?: string; // Optional additional className
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  isLoading,
  loadingText = 'Loading dashboard...',
  spinnerSize = 12,
  className = ''
}) => {
  const { colors } = useTheme();

  if (!isLoading) return null;

  return (
    <div
      className={`flex items-center justify-center min-h-screen ${className}`}
      style={{ backgroundColor: colors?.background2 || '#f0f0f0' }}
    >
      <div className="text-center">
        <div
          className="animate-spin rounded-full border-b-2"
          style={{ 
            borderColor: colors.primary,
            width: `${spinnerSize}px`,
            height: `${spinnerSize}px`
          }}
        ></div>
        <p style={{ color: colors.text }} className="mt-4">
          {loadingText}
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;