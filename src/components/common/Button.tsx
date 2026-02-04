import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    children,
    disabled,
    ...props
}, ref) => {
    return (
        <button
            ref={ref}
            disabled={isLoading || disabled}
            className={cn(
                'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-violet/50 disabled:pointer-events-none disabled:opacity-50',
                {
                    'bg-neon-violet text-white hover:bg-neon-violet/90': variant === 'primary',
                    'bg-white text-black hover:bg-gray-100': variant === 'secondary',
                    'bg-dev-card text-white hover:bg-white/10 border border-white/10': variant === 'outline',
                    'hover:bg-white/5 text-gray-300 hover:text-white': variant === 'ghost',
                    'bg-red-500/10 text-red-500 hover:bg-red-500/20': variant === 'danger',
                    'h-8 px-3 text-xs': size === 'sm',
                    'h-10 px-4 py-2': size === 'md',
                    'h-12 px-6': size === 'lg',
                    'h-10 w-10': size === 'icon',
                },
                className
            )}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export { Button };
