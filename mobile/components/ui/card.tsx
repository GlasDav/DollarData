import type { TextRef, ViewRef } from '@/types/primitives';
import { Text, View } from 'react-native';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils'; // Try relative path if alias fails in some contexts, but @/lib/utils should work.

const Card = forwardRef<ViewRef, React.ComponentPropsWithoutRef<typeof View> & { className?: string }>(
    ({ className, ...props }, ref) => (
        <View
            ref={ref}
            className={cn(
                'rounded-xl border border-border bg-card shadow-sm',
                className
            )}
            {...props}
        />
    )
);
Card.displayName = 'Card';

const CardHeader = forwardRef<ViewRef, React.ComponentPropsWithoutRef<typeof View> & { className?: string }>(
    ({ className, ...props }, ref) => (
        <View
            ref={ref}
            className={cn('flex flex-col space-y-1.5 p-6', className)}
            {...props}
        />
    )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<TextRef, React.ComponentPropsWithoutRef<typeof Text> & { className?: string }>(
    ({ className, ...props }, ref) => (
        <Text
            ref={ref}
            className={cn(
                'text-2xl font-semibold leading-none tracking-tight text-card-foreground',
                className
            )}
            {...props}
        />
    )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<TextRef, React.ComponentPropsWithoutRef<typeof Text> & { className?: string }>(
    ({ className, ...props }, ref) => (
        <Text
            ref={ref}
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />
    )
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<ViewRef, React.ComponentPropsWithoutRef<typeof View> & { className?: string }>(
    ({ className, ...props }, ref) => (
        <View ref={ref} className={cn('p-6 pt-0', className)} {...props} />
    )
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<ViewRef, React.ComponentPropsWithoutRef<typeof View> & { className?: string }>(
    ({ className, ...props }, ref) => (
        <View
            ref={ref}
            className={cn('flex flex-row items-center p-6 pt-0', className)}
            {...props}
        />
    )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
