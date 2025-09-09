import React from "react";

interface TooltipButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string; // Tooltip text
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const TooltipButton: React.FC<TooltipButtonProps> = ({
  onClick,
  icon,
  label,
  disabled = false,
  className = "",
  style,
}) => {
  return (
    <div className="relative group inline-block">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`p-2 rounded flex items-center gap-2 ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        style={style}
      >
        {icon}
      </button>

      {/* Tooltip */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        {label}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
      </div>
    </div>
  );
};

export default TooltipButton;
