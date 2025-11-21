import { TrendUp, TrendDown } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  price: number;
  change: number;
  changePercent: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function PriceDisplay({ 
  price, 
  change, 
  changePercent, 
  size = 'md',
  showIcon = true 
}: PriceDisplayProps) {
  const isPositive = change >= 0;
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  const priceClasses = {
    sm: 'text-lg font-semibold',
    md: 'text-2xl font-semibold',
    lg: 'text-3xl font-bold',
  };

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 20,
  };
  
  return (
    <div className="flex flex-col gap-1">
      <div className={cn('tabular-nums', priceClasses[size])}>
        ${price.toFixed(2)}
      </div>
      <div className={cn(
        'flex items-center gap-1 tabular-nums transition-colors duration-200',
        sizeClasses[size],
        isPositive ? 'price-positive' : 'price-negative'
      )}>
        {showIcon && (
          isPositive ? (
            <TrendUp size={iconSize[size]} weight="bold" />
          ) : (
            <TrendDown size={iconSize[size]} weight="bold" />
          )
        )}
        <span className="font-medium">
          {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}
