import { type VariantProps, cva } from 'class-variance-authority';
import { Text, Pressable, View } from 'react-native';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'group flex items-center justify-center rounded-md font-medium text-sm transition-colors disabled:pointer-events-none disabled:opacity-50 web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
    {
        variants: {
            variant: {
                default: 'bg-primary active:bg-primary/90',
                destructive: 'bg-destructive active:bg-destructive/90',
                outline:
                    'border border-input bg-background active:bg-accent active:text-accent-foreground',
                secondary: 'bg-secondary active:bg-secondary/80',
                ghost: 'active:bg-accent active:text-accent-foreground',
                link: 'underline-offset-4 hover:underline text-primary',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-md px-3',
                lg: 'h-11 rounded-md px-8',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

const buttonTextVariants = cva(
    'text-sm font-medium leading-none web:whitespace-nowrap',
    {
        variants: {
            variant: {
                default: 'text-primary-foreground',
                destructive: 'text-destructive-foreground',
                outline: 'text-foreground',
                secondary: 'text-secondary-foreground',
                ghost: 'text-foreground',
                link: 'text-primary',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

type ButtonProps = React.ComponentPropsWithoutRef<typeof Pressable> &
    VariantProps<typeof buttonVariants> & {
        label?: string;
        labelClasses?: string;
        className?: string;
    };

const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
    ({ className, variant, size, label, labelClasses, children, ...props }, ref) => {
        return (
            <Pressable
                ref={ref}
                className={cn(buttonVariants({ variant, size, className }))}
                {...props}
            >
                {children ? (
                    children
                ) : (
                    <Text
                        className={cn(buttonTextVariants({ variant }), labelClasses)}
                    >
                        {label}
                    </Text>
                )}
            </Pressable>
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
