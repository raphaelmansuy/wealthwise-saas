import { Fund } from '@/lib/wealthwise/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendUp, TrendDown, Star } from '@phosphor-icons/react';
import { formatAssets, getCategoryLabel } from '@/lib/wealthwise/market-data';

interface FundCardProps {
  fund: Fund;
  onClick?: () => void;
}

export function FundCard({ fund, onClick }: FundCardProps) {
  const isPositive = fund.change >= 0;

  return (
    <Card
      className="p-4 hover:border-accent transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{fund.symbol}</span>
              <Badge variant="outline" className="text-xs uppercase">
                {fund.type}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {getCategoryLabel(fund.category)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">{fund.name}</p>
          </div>
          <div className="flex items-center gap-1 text-warning">
            {[...Array(fund.morningstarRating)].map((_, i) => (
              <Star key={i} size={12} weight="fill" />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">
              ${fund.price.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">NAV</p>
          </div>
          <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? <TrendUp size={16} weight="bold" /> : <TrendDown size={16} weight="bold" />}
            <span className="font-medium">
              {isPositive ? '+' : ''}{fund.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border text-xs">
          <div>
            <p className="text-muted-foreground mb-0.5">Expense</p>
            <p className="font-medium">{fund.expenseRatio.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">1Y Return</p>
            <p className={`font-medium ${fund.oneYearReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
              {fund.oneYearReturn >= 0 ? '+' : ''}{fund.oneYearReturn.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">Assets</p>
            <p className="font-medium">{formatAssets(fund.totalAssets)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
