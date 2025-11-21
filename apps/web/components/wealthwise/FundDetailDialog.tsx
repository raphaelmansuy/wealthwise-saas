import { Fund } from '@/lib/wealthwise/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendUp, TrendDown, Star, ChartLine, Percent, Calendar, Coins, Briefcase, ArrowsClockwise } from '@phosphor-icons/react';
import { formatAssets, getCategoryLabel } from '@/lib/wealthwise/market-data';

interface FundDetailDialogProps {
  fund: Fund | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FundDetailDialog({ fund, open, onOpenChange }: FundDetailDialogProps) {
  if (!fund) return null;

  const isPositive = fund.change >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <DialogTitle className="text-2xl">{fund.symbol}</DialogTitle>
                <Badge variant="outline" className="uppercase">
                  {fund.type}
                </Badge>
                <Badge variant="secondary">
                  {getCategoryLabel(fund.category)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{fund.name}</p>
            </div>
            <div className="flex items-center gap-1 text-warning">
              {[...Array(fund.morningstarRating)].map((_, i) => (
                <Star key={i} size={16} weight="fill" />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                ({fund.morningstarRating}/5)
              </span>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Net Asset Value</p>
                  <p className="text-3xl font-semibold">${fund.nav.toFixed(2)}</p>
                </div>
                <div className={`flex items-center gap-2 text-lg ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {isPositive ? <TrendUp size={24} weight="bold" /> : <TrendDown size={24} weight="bold" />}
                  <div className="text-right">
                    <p className="font-semibold">
                      {isPositive ? '+' : ''}{fund.changePercent.toFixed(2)}%
                    </p>
                    <p className="text-sm">
                      {isPositive ? '+' : ''}${fund.change.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <ChartLine size={20} weight="bold" className="text-primary" />
                <h3 className="font-semibold">Performance</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">YTD Return</p>
                  <p className={`text-lg font-semibold ${fund.ytdReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {fund.ytdReturn >= 0 ? '+' : ''}{fund.ytdReturn.toFixed(2)}%
                  </p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">1 Year Return</p>
                  <p className={`text-lg font-semibold ${fund.oneYearReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {fund.oneYearReturn >= 0 ? '+' : ''}{fund.oneYearReturn.toFixed(2)}%
                  </p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">3 Year Return</p>
                  <p className={`text-lg font-semibold ${fund.threeYearReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {fund.threeYearReturn >= 0 ? '+' : ''}{fund.threeYearReturn.toFixed(2)}%
                  </p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">5 Year Return</p>
                  <p className={`text-lg font-semibold ${fund.fiveYearReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {fund.fiveYearReturn >= 0 ? '+' : ''}{fund.fiveYearReturn.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Percent size={20} weight="bold" className="text-primary" />
                <h3 className="font-semibold">Fees & Costs</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <span className="text-sm text-muted-foreground">Expense Ratio</span>
                  <span className="font-semibold">{fund.expenseRatio.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <span className="text-sm text-muted-foreground">Minimum Investment</span>
                  <span className="font-semibold">
                    {fund.minimumInvestment === 0 ? 'None' : `$${fund.minimumInvestment.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <span className="text-sm text-muted-foreground">Dividend Yield</span>
                  <span className="font-semibold">{fund.dividendYield.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase size={20} weight="bold" className="text-primary" />
                <h3 className="font-semibold">Fund Details</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Coins size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Assets</span>
                  </div>
                  <span className="font-semibold">{formatAssets(fund.totalAssets)}</span>
                </div>
                <div className="flex items-start justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Number of Holdings</span>
                  </div>
                  <span className="font-semibold">{fund.holdings.toLocaleString()}</span>
                </div>
                <div className="flex items-start justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-2">
                    <ArrowsClockwise size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Turnover Rate</span>
                  </div>
                  <span className="font-semibold">{fund.turnoverRate}%</span>
                </div>
                <div className="flex items-start justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Inception Date</span>
                  </div>
                  <span className="font-semibold">
                    {new Date(fund.inceptionDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <ChartLine size={20} weight="bold" className="text-primary" />
                <h3 className="font-semibold">Risk Metrics</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Beta</p>
                  <p className="text-lg font-semibold">{fund.beta.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fund.beta < 1 ? 'Less volatile than market' : fund.beta > 1 ? 'More volatile than market' : 'Market volatility'}
                  </p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Sharpe Ratio</p>
                  <p className="text-lg font-semibold">{fund.sharpeRatio.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fund.sharpeRatio > 1 ? 'Good risk-adjusted return' : 'Moderate risk-adjusted return'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg text-xs text-muted-foreground">
              <p className="font-medium mb-1">Disclaimer</p>
              <p>
                Past performance does not guarantee future results. Investment value and returns will fluctuate. 
                This information is for educational purposes only and should not be considered investment advice.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
