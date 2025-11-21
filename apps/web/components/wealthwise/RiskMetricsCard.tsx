import { Card } from '@/components/ui/card';
import { RiskMetrics } from '@/lib/wealthwise/types';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from '@phosphor-icons/react';

interface RiskMetricsCardProps {
  metrics: RiskMetrics;
}

export function RiskMetricsCard({ metrics }: RiskMetricsCardProps) {
  const getHealthScoreColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getHealthScoreDescription = (score: number) => {
    if (score >= 70) return 'Healthy';
    if (score >= 50) return 'Moderate';
    return 'Needs Attention';
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Risk & Performance Metrics</h3>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Portfolio Health Score</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={14} className="text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Composite score based on volatility, Sharpe ratio, and drawdown metrics. Higher is better.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className={`text-2xl font-bold ${getHealthScoreColor(metrics.healthScore)}`}>
              {metrics.healthScore}/100
            </span>
          </div>
          <Progress value={metrics.healthScore} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">{getHealthScoreDescription(metrics.healthScore)}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Volatility</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={12} className="text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Measures price fluctuation. Lower is generally better for stability.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-lg font-semibold">{metrics.volatility.toFixed(2)}%</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Beta</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={12} className="text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Measures portfolio sensitivity to market movements. 1.0 = market average.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-lg font-semibold">{metrics.beta.toFixed(2)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={12} className="text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Risk-adjusted returns. Higher values indicate better return per unit of risk.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-lg font-semibold">{metrics.sharpeRatio.toFixed(2)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Max Drawdown</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={12} className="text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Largest peak-to-trough decline. Lower is better.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-lg font-semibold text-destructive">{metrics.maxDrawdown.toFixed(2)}%</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
