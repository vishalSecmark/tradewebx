import React from "react";
import Loader from "../Loader";
import { useTheme } from "@/context/ThemeContext";

interface LoaderOverlayProps {
  loading?: boolean;
  text?: string;
  zIndex?: number;
  restStyles?: React.CSSProperties;
}

const LoaderOverlay: React.FC<LoaderOverlayProps> = ({
  loading = false,
  text = "Loading...",
  zIndex = 50,
}) => {
  const { colors } = useTheme();
  
  if (!loading) return null;

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center`}
      style={{ zIndex,
         backgroundColor: colors.background,
          opacity: 0.7
      }}
    >
      <div className="flex flex-col items-center">
        {/* Spinner */}
        <Loader/> 
        {/* Loading text */}
        {text && (
          <p 
            className="mt-4 font-medium"
            style={{
              textColor : colors.text
            }}
            >
              {text}
            </p>
        )}
      </div>
    </div>
  );
};

export default LoaderOverlay;