import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
    primary: "bg-primary hover:bg-primary-hover text-white shadow-sm border-transparent",
    secondary: "bg-card dark:bg-card-dark text-text-primary dark:text-text-primary-dark border border-border dark:border-border-dark hover:bg-surface dark:hover:bg-surface-dark shadow-sm",
    outline: "bg-transparent border-2 border-border dark:border-border-dark text-text-secondary dark:text-text-secondary-dark hover:border-primary hover:text-primary dark:hover:text-primary-light",
    ghost: "bg-transparent text-text-secondary dark:text-text-secondary-dark hover:bg-surface dark:hover:bg-surface-dark",
    danger: "bg-accent-error/10 text-accent-error hover:bg-accent-error/20 border border-transparent",
};

const SIZES = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "p-2",
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    isLoading = false,
    disabled = false,
    icon: Icon,
    ...props
}) {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-surface-dark disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    return (
        <button
            className={`${baseStyles} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {!isLoading && Icon && <Icon className={`w-4 h-4 ${children ? 'mr-2' : ''}`} />}
            {children}
        </button>
    );
}
