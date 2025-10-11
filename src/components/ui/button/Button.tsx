"use client";

import React, { ReactNode } from "react";
import { useTheme } from "@/context/ThemeContext";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: "sm" | "md";
  variant?: "primary" | "outline";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  dynamicSelectedThemeApply?: boolean; // New prop to enable dynamic theming
  borderRadius?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  borderRadius = "normal",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  dynamicSelectedThemeApply = true, // Set default to true to always use theme colors
  ...props
}) => {
  const { colors } = useTheme();

  // Size Classes
  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-3 py-2 text-sm",
  };

  const bRadius ={
    normal : "rounded-lg",
    full : "rounded-full"
  }

  // Variant Classes
  const variantClasses = {
    primary: "shadow-theme-xs",
    outline: "ring-1 ring-inset",
  };

  // Dynamic theme styles
  const dynamicStyles = dynamicSelectedThemeApply ? {
    backgroundColor: variant === 'primary' ? colors.buttonBackground : 'transparent',
    color: colors.buttonText,
    borderColor: variant === 'outline' ? colors.buttonBackground : 'transparent',
    borderWidth: variant === 'outline' ? '1px' : '0',
    '&:hover': {
      backgroundColor: variant === 'primary' ? colors.primary : colors.buttonBackground + '10',
    }
  } : undefined;

  return (
    <button
      className={`inline-flex items-center justify-center font-medium gap-2 ${bRadius[borderRadius]} transition ${className} ${sizeClasses[size]} ${
        // Only apply variant classes if dynamic theme is not enabled
        !dynamicSelectedThemeApply ? variantClasses[variant] : ''
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      style={dynamicStyles}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;