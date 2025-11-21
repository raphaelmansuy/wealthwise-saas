import { Star } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriceDisplay } from './PriceDisplay';
import { Stock } from '@/lib/wealthwise/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StockCardProps {
  stock: Stock;
  isInWatchlist: boolean;
  onToggleWatchlist: (symbol: string) => void;
  onClick: (stock: Stock) => void;
}

export function StockCard({ stock, isInWatchlist, onToggleWatchlist, onClick }: StockCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          "p-6 cursor-pointer transition-all duration-150 hover:shadow-md hover:border-accent",
          "group relative"
        )}
        onClick={() => onClick(stock)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold tracking-wide mb-1">{stock.symbol}</h3>
            <p className="text-sm text-muted-foreground truncate">{stock.name}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 -mt-2 -mr-2"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist(stock.symbol);
            }}
          >
            <Star 
              size={20} 
              weight={isInWatchlist ? 'fill' : 'regular'}
              className={cn(
                'transition-all duration-200',
                isInWatchlist && 'text-yellow-500'
              )}
            />
          </Button>
        </div>
        
        <PriceDisplay 
          price={stock.price}
          change={stock.change}
          changePercent={stock.changePercent}
          size="sm"
        />
        
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Volume</span>
            <p className="font-medium mt-0.5">{(stock.volume / 1000000).toFixed(2)}M</p>
          </div>
          <div>
            <span className="text-muted-foreground">Market Cap</span>
            <p className="font-medium mt-0.5">
              {stock.marketCap >= 1e12 ? `$${(stock.marketCap / 1e12).toFixed(2)}T` : `$${(stock.marketCap / 1e9).toFixed(2)}B`}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
