import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const base = "inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none";
  
  const variants = {
    primary: "bg-[#111111] text-white hover:bg-black border border-black",
    secondary: "bg-[#F7F7F7] text-[#111111] hover:bg-[#EAEAEA] border border-[#E5E5E5]",
    outline: "bg-white text-[#111111] hover:bg-[#F7F7F7] border border-[#E5E5E5]",
    danger: "bg-white text-[#991B1B] hover:bg-[#FEE2E2] border border-[#FCA5A5]"
  };

  const sizes = {
    sm: "text-xs px-2.5 py-1 gap-1.5 h-7",
    md: "text-xs px-3.5 py-1.5 gap-2 h-8",
    lg: "text-sm px-4 py-2 gap-2.5 h-9"
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : null}
      {children}
    </button>
  );
};

interface BadgeProps {
  status?: string;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, children, className }) => {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider border",
        status === "APPROVED" || status === "COMPLETED" || status === "SUCCESS"
          ? "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
          : status === "READY_FOR_REVIEW" || status === "VALIDATION_REQUIRED"
          ? "bg-[#FEFCE8] text-[#854D0E] border-[#FEF08A]"
          : status === "FAILED"
          ? "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]"
          : "bg-[#F7F7F7] text-[#4B5563] border-[#E5E5E5]",
        className
      )}
    >
      {children}
    </span>
  );
};

