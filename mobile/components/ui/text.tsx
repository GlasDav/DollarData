import { Text as RNText } from 'react-native';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Maps simple variant names to Tailwind classes
const VARIANTS = {
    default: 'text-base text-foreground',
    h1: 'text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground',
    h2: 'text-3xl font-semibold tracking-tight first:mt-0 text-foreground',
    h3: 'text-2xl font-semibold tracking-tight text-foreground',
    h4: 'text-xl font-semibold tracking-tight text-foreground',
    p: 'leading-7 text-foreground',
    lead: 'text-xl text-muted-foreground',
    large: 'text-lg font-semibold text-foreground',
    small: 'text-sm font-medium leading-none text-foreground', // Replaced "text-sm font-medium leading-none" used in button but usually useful generally
    muted: 'text-sm text-muted-foreground',
};

interface TextProps extends React.ComponentPropsWithoutRef<typeof RNText> {
    className?: string;
    variant?: keyof typeof VARIANTS;
}

const Text = forwardRef<React.ElementRef<typeof RNText>, TextProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        return (
            <RNText
                ref={ref}
                className={cn(
                    // Base font family can be added here if not globally set
                    'font-sans', // Assuming generic implementation uses this for custom font
                    VARIANTS[variant],
                    className
                )}
                {...props}
            />
        );
    }
);
Text.displayName = 'Text';

export { Text };
