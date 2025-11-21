import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Portfolio } from '@/lib/wealthwise/types';
import { TrendUp, TrendDown, Briefcase } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PortfolioCardProps {
  portfolio: Portfolio;
  onClick: () => void;
  selected?: boolean;
}

export function PortfolioCard({ portfolio, onClick, selected }: PortfolioCardProps) {
  const isPositive = portfolio.totalGainLoss >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'p-6 cursor-pointer transition-all duration-400 hover:shadow-md',
          selected ? 'border-primary bg-accent/5' : 'hover:border-accent'
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Briefcase size={20} className="text-primary" weight="bold" />
            </div>
            <div>
              <h3 className="font-semibold text-base">{portfolio.name}</h3>
              {portfolio.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{portfolio.description}</p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {portfolio.holdings.length} {portfolio.holdings.length === 1 ? 'position' : 'positions'}
          </Badge>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Value</p>
            <p className="text-2xl font-semibold value-transition">
              ${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendUp size={16} className="text-success" weight="bold" />
            ) : (
              <TrendDown size={16} className="text-destructive" weight="bold" />
            )}
            <span className={cn(
              'text-sm font-medium',
              isPositive ? 'text-success' : 'text-destructive'
            )}>
              {isPositive ? '+' : ''}{portfolio.totalGainLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {' '}
              ({isPositive ? '+' : ''}{portfolio.totalGainLossPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
