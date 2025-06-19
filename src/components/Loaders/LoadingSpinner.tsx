import React from "react";

interface LoaderOverlayProps {
  loading?: boolean;
  text?: string;
  spinnerColor?: string;
  overlayColor?: string;
  zIndex?: number;
}

const LoaderOverlay: React.FC<LoaderOverlayProps> = ({
  loading = false,
  text = "Loading...",
  spinnerColor = "text-blue-500",
  overlayColor = "bg-black bg-opacity-50",
  zIndex = 50,
}) => {
  if (!loading) return null;

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center ${overlayColor}`}
      style={{ zIndex }}
    >
      <div className="flex flex-col items-center">
        {/* Spinner */}
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${spinnerColor}`}></div>
        
        {/* Loading text */}
        {text && (
          <p className="mt-4 text-white font-medium">{text}</p>
        )}
      </div>
    </div>
  );
};

export default LoaderOverlay;