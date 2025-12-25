import React from 'react';
import { Link } from 'react-router-dom';
import Button from './ui/Button';

/**
 * EmptyState component for displaying when there's no data
 * @param {Object} props
 * @param {React.ElementType} props.icon - Lucide icon component
 * @param {string} props.title - Main heading
 * @param {string} props.description - Description text
 * @param {string} [props.actionText] - Button text
 * @param {string} [props.actionLink] - Link destination
 * @param {function} [props.onAction] - onClick handler if no link
 */
export default function EmptyState({
    icon: Icon,
    title,
    description,
    actionText,
    actionLink,
    onAction,
    secondaryAction
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            {/* Animated icon container */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/30 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                    <Icon className="text-indigo-500 dark:text-indigo-400" size={36} />
                </div>
            </div>

            {/* Text content */}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                {title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm mb-8 leading-relaxed">
                {description}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Primary Action */}
                {(actionText && (actionLink || onAction)) && (
                    actionLink ? (
                        <Link to={actionLink}>
                            <Button variant="primary" size="lg">
                                {actionText}
                            </Button>
                        </Link>
                    ) : (
                        <Button variant="primary" size="lg" onClick={onAction}>
                            {actionText}
                        </Button>
                    )
                )}

                {/* Secondary Action (Optional) */}
                {secondaryAction && (
                    <div className="mt-2 sm:mt-0">
                        {secondaryAction}
                    </div>
                )}
            </div>
        </div>
    );
}
