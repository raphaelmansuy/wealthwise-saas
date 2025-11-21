import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PriceDisplay } from './PriceDisplay';
import { Stock } from '@/lib/wealthwise/types';
import { formatMarketCap, formatVolume } from '@/lib/wealthwise/market-data';
import { formatDistanceToNow } from 'date-fns';

interface StockDetailDialogProps {
  stock: Stock | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockDetailDialog({ stock, open, onOpenChange }: StockDetailDialogProps) {
  if (!stock) return null;

  const lastUpdated = formatDistanceToNow(new Date(stock.lastUpdated), { addSuffix: true });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl font-bold mb-1">{stock.symbol}</DialogTitle>
              <p className="text-base text-muted-foreground">{stock.name}</p>
            </div>
            <Badge variant="outline" className="shrink-0">NYSE</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <PriceDisplay 
              price={stock.price}
              change={stock.change}
              changePercent={stock.changePercent}
              size="lg"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Last updated {lastUpdated}
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Open</p>
                <p className="text-lg font-semibold">${stock.open.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">High</p>
                <p className="text-lg font-semibold price-positive">${stock.high.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Low</p>
                <p className="text-lg font-semibold price-negative">${stock.low.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Previous Close</p>
                <p className="text-lg font-semibold">${stock.previousClose.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Volume</p>
                <p className="text-lg font-semibold">{formatVolume(stock.volume)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Market Cap</p>
                <p className="text-lg font-semibold">{formatMarketCap(stock.marketCap)}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-sm">Day's Range</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">${stock.low.toFixed(2)}</span>
              <div className="flex-1 h-2 bg-muted rounded-full relative overflow-hidden">
                <div 
                  className="absolute h-full bg-gradient-to-r from-destructive via-accent to-success"
                  style={{
                    left: '0%',
                    right: '0%',
                  }}
                />
                <div 
                  className="absolute w-3 h-3 bg-foreground rounded-full -mt-0.5 border-2 border-background"
                  style={{
                    left: `${((stock.price - stock.low) / (stock.high - stock.low)) * 100}%`,
                    transform: 'translateX(-50%)',
                  }}
                />
              </div>
              <span className="text-sm font-medium">${stock.high.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
