import { TextInput, View } from 'react-native';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
    extends React.ComponentPropsWithoutRef<typeof TextInput> {
    className?: string;
}

const Input = forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
    ({ className, placeholderTextColor, ...props }, ref) => {
        return (
            <TextInput
                ref={ref}
                className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    className
                )}
                placeholderTextColor={placeholderTextColor ?? '#666'} // Fallback for placeholder color if simpler
                {...props}
            />
        );
    }
);
Input.displayName = 'Input';

export { Input };
