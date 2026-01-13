"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Search, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export interface InputProps 
extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  variant?: "default" | "filled" | "outlined" | "ghost";
  size?: "sm" | "md" | "lg";
  status?: "default" | "success" | "error" | "loading";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  label?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type,
    variant = "default",
    size = "md",
    status = "default",
    leftIcon,
    rightIcon,
    fullWidth = true,
    label,
    helperText,
    disabled,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    const baseClasses = cn(
      "flex items-center transition-all duration-200 border bg-white font-medium placeholder:font-normal",
      "focus:outline-none focus:ring-2 focus:ring-offset-1",
      "disabled:cursor-not-allowed disabled:opacity-60",
      "read-only:cursor-default read-only:opacity-80",
      fullWidth && "w-full",
      // Size variants
      {
        "h-8 text-sm px-3": size === "sm",
        "h-10 text-sm px-4": size === "md",
        "h-12 text-base px-4": size === "lg",
      },
      // Variant styles
      {
        // Default variant
        "border-gray-300 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500/20":
          variant === "default" && status === "default",
        "border-gray-200 bg-gray-50 text-gray-900 focus:border-primary-500 focus:ring-primary-500/20":
          variant === "filled" && status === "default",
        "border-2 border-gray-200 bg-transparent text-gray-900 focus:border-primary-500 focus:ring-primary-500/20":
          variant === "outlined" && status === "default",
        "border-transparent bg-transparent text-gray-900 shadow-none focus:ring-primary-500/20":
          variant === "ghost" && status === "default",
        
        // Success state
        "border-green-500 text-gray-900 focus:border-green-500 focus:ring-green-500/20":
          status === "success",
        "border-green-500 bg-green-50 text-gray-900 focus:border-green-500 focus:ring-green-500/20":
          variant === "filled" && status === "success",
        
        // Error state
        "border-red-500 text-gray-900 focus:border-red-500 focus:ring-red-500/20":
          status === "error",
        "border-red-500 bg-red-50 text-gray-900 focus:border-red-500 focus:ring-red-500/20":
          variant === "filled" && status === "error",
        
        // Loading state
        "border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-primary-500/20":
          status === "loading",
      },
      // Icons padding
      leftIcon && {
        "pl-10": size === "sm",
        "pl-11": size === "md",
        "pl-12": size === "lg",
      },
      (rightIcon || isPassword || status !== "default") && {
        "pr-10": size === "sm",
        "pr-11": size === "md",
        "pr-12": size === "lg",
      }
    );

    const getStatusIcon = () => {
      switch (status) {
        case "success":
          return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        case "error":
          return <AlertCircle className="h-4 w-4 text-red-500" />;
        case "loading":
          return <Loader2 className="h-4 w-4 text-primary-500 animate-spin" />;
        default:
          return null;
      }
    };

    const getIconSize = () => {
      switch (size) {
        case "sm": return "h-3.5 w-3.5";
        case "md": return "h-4 w-4";
        case "lg": return "h-5 w-5";
        default: return "h-4 w-4";
      }
    };

    return (
      <div className={cn("space-y-2", fullWidth && "w-full")}>
        {/* Label */}
        {label && (
          <label 
            htmlFor={props.id}
            className={cn(
              "block text-sm font-medium text-gray-700",
              disabled && "text-gray-400"
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className={cn(
              "absolute left-0 top-0 bottom-0 flex items-center justify-center text-gray-400",
              {
                "pl-3": size === "sm",
                "pl-4": size === "md",
                "pl-5": size === "lg",
              }
            )}>
              {React.cloneElement(leftIcon as React.ReactElement<any>, {
                className: cn(getIconSize(), (leftIcon as React.ReactElement<any>).props.className)
              })}
            </div>
          )}

          {/* Input */}
          <input
            type={inputType}
            className={cn(baseClasses, className)}
            ref={ref}
            disabled={disabled}
            {...props}
          />

          {/* Right Content */}
          <div className={cn(
            "absolute right-0 top-0 bottom-0 flex items-center space-x-1",
            {
              "pr-3": size === "sm",
              "pr-4": size === "md",
              "pr-5": size === "lg",
            }
          )}>
            {/* Status Icon */}
            {status !== "default" && getStatusIcon()}

            {/* Password Toggle */}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn(
                  "text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 rounded",
                  getIconSize()
                )}
                disabled={disabled}
              >
                {showPassword ? <EyeOff className="w-full h-full" /> : <Eye className="w-full h-full" />}
              </button>
            )}

            {/* Custom Right Icon */}
            {rightIcon && !isPassword && status === "default" && (
              <div className="text-gray-400">
                {React.cloneElement(rightIcon as React.ReactElement<any>, {
                  className: cn(getIconSize(), (rightIcon as React.ReactElement<any>).props.className)
                })}
              </div>
            )}
          </div>
        </div>

        {/* Helper Text */}
        {helperText && (
          <p className={cn(
            "text-xs",
            status === "error" ? "text-red-600" : "text-gray-500",
            disabled && "text-gray-400"
          )}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// Specialized Input Components
const SearchInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'leftIcon'>>(
  (props, ref) => (
    <Input
      ref={ref}
      leftIcon={<Search className="text-gray-400" />}
      placeholder="Search..."
      {...props}
    />
  )
);
SearchInput.displayName = "SearchInput";

const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => (
    <Input
      ref={ref}
      type="password"
      placeholder="Enter password..."
      {...props}
    />
  )
);
PasswordInput.displayName = "PasswordInput";

export { Input, SearchInput, PasswordInput };