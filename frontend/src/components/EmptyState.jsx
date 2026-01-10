import React from 'react';
import { Link } from 'react-router-dom';
import Button from './ui/Button';

/**
 * EmptyState component for displaying when there's no data
 * @param {Object} props
 * @param {React.ElementType} props.icon - Lucide icon component
 * @param {React.ReactNode} [props.illustration] - Custom SVG illustration component
 * @param {string} props.title - Main heading
 * @param {string} props.description - Description text
 * @param {string} [props.actionText] - Button text
 * @param {string} [props.actionLink] - Link destination
 * @param {function} [props.onAction] - onClick handler if no link
 */
export default function EmptyState({
    icon: Icon,
    illustration: Illustration,
    title,
    description,
    actionText,
    actionLink,
    onAction,
    secondaryAction
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            {/* Custom Illustration or Animated icon container */}
            {Illustration ? (
                <div className="mb-6">
                    {Illustration}
                </div>
            ) : Icon && (
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                        <Icon className="text-primary" size={36} />
                    </div>
                </div>
            )}

            {/* Text content */}
            <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2 text-center">
                {title}
            </h3>
            <p className="text-text-muted text-center max-w-sm mb-8 leading-relaxed">
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
