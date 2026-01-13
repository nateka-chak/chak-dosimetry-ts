"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "filled";
  hoverable?: boolean;
}

function Card({ 
  className, 
  variant = "default",
  hoverable = true,
  ...props 
}: CardProps) {
  const baseClasses = cn(
    "relative overflow-hidden bg-white border transition-all duration-300",
    // Variant styles
    {
      "rounded-2xl shadow-sm": variant === "default",
      "rounded-2xl shadow-lg": variant === "elevated", 
      "rounded-xl border-2 border-gray-200 shadow-xs": variant === "outlined",
      "rounded-2xl bg-gray-50 border-gray-100 shadow-xs": variant === "filled",
    },
    // Hover effects
    hoverable && cn(
      "hover:shadow-xl hover:-translate-y-1",
      {
        "hover:border-primary-200": variant === "default" || variant === "elevated",
        "hover:border-primary-300": variant === "outlined",
        "hover:bg-gray-100": variant === "filled",
      }
    ),
    className
  );

  return (
    <div className={baseClasses} {...props} />
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  withDivider?: boolean;
}

function CardHeader({
  className,
  withDivider = true,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 p-6 pb-4",
        withDivider && "border-b border-gray-100",
        className
      )}
      {...props}
    />
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size?: "sm" | "md" | "lg" | "xl";
}

function CardTitle({
  className,
  as: Component = "h3",
  size = "md",
  ...props
}: CardTitleProps) {
  return (
    <Component
      className={cn(
        "font-semibold leading-none tracking-tight text-gray-900",
        {
          "text-lg": size === "sm",
          "text-xl": size === "md", 
          "text-2xl": size === "lg",
          "text-3xl": size === "xl",
        },
        className
      )}
      {...props}
    />
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: "sm" | "md";
}

function CardDescription({
  className,
  size = "md",
  ...props
}: CardDescriptionProps) {
  return (
    <p
      className={cn(
        "text-gray-600",
        {
          "text-sm": size === "sm",
          "text-base": size === "md",
        },
        className
      )}
      {...props}
    />
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

function CardContent({
  className,
  padded = true,
  ...props
}: CardContentProps) {
  return (
    <div
      className={cn(
        padded && "p-6 pt-4",
        // Ensure form elements are properly styled
        "[&_input]:text-gray-900 [&_textarea]:text-gray-900 [&_select]:text-gray-900",
        "[&_input]:bg-white [&_textarea]:bg-white [&_select]:bg-white",
        "[&_input]:border [&_textarea]:border [&_select]:border",
        "[&_input]:border-gray-300 [&_textarea]:border-gray-300 [&_select]:border-gray-300",
        "[&_input]:rounded-lg [&_textarea]:rounded-lg [&_select]:rounded-lg",
        "[&_input]:px-3 [&_textarea]:px-3 [&_select]:px-3",
        "[&_input]:py-2 [&_textarea]:py-2 [&_select]:py-2",
        "[&_input:focus]:outline-none [&_textarea:focus]:outline-none [&_select:focus]:outline-none",
        "[&_input:focus]:ring-2 [&_textarea:focus]:ring-2 [&_select:focus]:ring-2",
        "[&_input:focus]:ring-primary-500 [&_textarea:focus]:ring-primary-500 [&_select:focus]:ring-primary-500",
        "[&_input:focus]:border-primary-500 [&_textarea:focus]:border-primary-500 [&_select:focus]:border-primary-500",
        "[&_input::placeholder]:text-gray-400 [&_textarea::placeholder]:text-gray-400",
        className
      )}
      {...props}
    />
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  withDivider?: boolean;
  align?: "start" | "center" | "end" | "between";
}

function CardFooter({
  className,
  withDivider = true,
  align = "between",
  ...props
}: CardFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center p-6 pt-4",
        withDivider && "border-t border-gray-100",
        {
          "justify-start": align === "start",
          "justify-center": align === "center", 
          "justify-end": align === "end",
          "justify-between": align === "between",
        },
        className
      )}
      {...props}
    />
  );
}

// Additional card variants
interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
}

function StatCard({
  title,
  value,
  description,
  trend,
  icon,
  className,
  ...props
}: StatCardProps) {
  return (
    <Card className={cn("p-6", className)} {...props}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center mt-2 text-sm font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              <span>
                {trend.isPositive ? "↗" : "↘"} {Math.abs(trend.value)}%
              </span>
              <span className="text-gray-500 ml-1">from last period</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

interface ActionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  action: React.ReactNode;
  icon?: React.ReactNode;
}

function ActionCard({
  title,
  description,
  action,
  icon,
  className,
  ...props
}: ActionCardProps) {
  return (
    <Card className={cn("p-6", className)} {...props}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="flex-shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-gray-600 mt-1">{description}</p>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 ml-4">
          {action}
        </div>
      </div>
    </Card>
  );
}

export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  StatCard,
  ActionCard
};