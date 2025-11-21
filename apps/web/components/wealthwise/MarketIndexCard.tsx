import { Card } from '@/components/ui/card';
import { MarketIndex } from '@/lib/wealthwise/types';
import { cn } from '@/lib/utils';
import { TrendUp, TrendDown } from '@phosphor-icons/react';

interface MarketIndexCardProps {
  index: MarketIndex;
}

export function MarketIndexCard({ index }: MarketIndexCardProps) {
  const isPositive = index.change >= 0;
  
  return (
    <Card className="p-4 min-w-[180px]">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{index.symbol}</span>
          {isPositive ? (
            <TrendUp size={14} className="price-positive" weight="bold" />
          ) : (
            <TrendDown size={14} className="price-negative" weight="bold" />
          )}
        </div>
        <div className="text-sm font-medium text-muted-foreground">{index.name}</div>
        <div className="text-xl font-bold tabular-nums">{index.value.toLocaleString()}</div>
        <div className={cn(
          'text-sm font-medium tabular-nums transition-colors duration-200',
          isPositive ? 'price-positive' : 'price-negative'
        )}>
          {isPositive ? '+' : ''}{index.change.toFixed(2)} ({isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%)
        </div>
      </div>
    </Card>
  );
}
