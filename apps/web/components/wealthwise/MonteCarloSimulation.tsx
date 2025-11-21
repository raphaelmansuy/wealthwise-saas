import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Portfolio } from '@/lib/wealthwise/types';
import { runMonteCarloSimulation } from '@/lib/wealthwise/simulation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ChartBarHorizontal, Play, ArrowsClockwise } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

interface MonteCarloSimulationProps {
  portfolio: Portfolio;
}

export function MonteCarloSimulation({ portfolio }: MonteCarloSimulationProps) {
  const [years, setYears] = useState(10);
  const [iterations, setIterations] = useState(1000);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [simulationData, setSimulationData] = useState<{
    paths: number[][];
    percentiles: { p25: number[]; p50: number[]; p75: number[] };
  } | null>(null);

  const runSimulation = async () => {
    setIsRunning(true);
    setHasRun(false);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const result = runMonteCarloSimulation(portfolio, years, iterations);
    setSimulationData(result);
    setHasRun(true);
    setIsRunning(false);
  };

  const chartData = useMemo(() => {
    if (!simulationData) return [];

    const data: Array<{
      month: number;
      year: string;
      p25: number;
      p50: number;
      p75: number;
    }> = [];
    const months = years * 12;

    for (let i = 0; i <= months; i++) {
      data.push({
        month: i,
        year: (i / 12).toFixed(1),
        p25: simulationData.percentiles.p25[i],
        p50: simulationData.percentiles.p50[i],
        p75: simulationData.percentiles.p75[i],
      });
    }

    return data;
  }, [simulationData, years]);

  const projectionStats = useMemo(() => {
    if (!simulationData || chartData.length === 0) return null;

    const finalData = chartData[chartData.length - 1];
    const initial = portfolio.totalValue;

    return {
      p25Return: ((finalData.p25 - initial) / initial) * 100,
      p50Return: ((finalData.p50 - initial) / initial) * 100,
      p75Return: ((finalData.p75 - initial) / initial) * 100,
      p25Value: finalData.p25,
      p50Value: finalData.p50,
      p75Value: finalData.p75,
    };
  }, [simulationData, chartData, portfolio.totalValue]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ChartBarHorizontal size={20} weight="bold" />
              Monte Carlo Simulation
            </CardTitle>
            <CardDescription>
              Project future portfolio performance with {iterations.toLocaleString()} simulated paths over {years} years
            </CardDescription>
          </div>
          <Button
            onClick={runSimulation}
            disabled={isRunning}
            className="deliberate-action"
          >
            {isRunning ? (
              <>
                <ArrowsClockwise size={16} className="mr-2 animate-spin" weight="bold" />
                Running...
              </>
            ) : (
              <>
                <Play size={16} className="mr-2" weight="bold" />
                Run Simulation
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Time Horizon: {years} years</Label>
              <Slider
                value={[years]}
                onValueChange={(value) => setYears(value[0])}
                min={1}
                max={30}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 year</span>
                <span>30 years</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Simulations: {iterations.toLocaleString()}</Label>
              <Slider
                value={[iterations]}
                onValueChange={(value) => setIterations(value[0])}
                min={100}
                max={5000}
                step={100}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>100</span>
                <span>5,000</span>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isRunning && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Skeleton className="h-80 w-full" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            </motion.div>
          )}

          {!isRunning && hasRun && simulationData && projectionStats && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorP25" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.52 0.18 25)" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="oklch(0.52 0.18 25)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorP50" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.55 0.12 240)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.55 0.12 240)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorP75" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.62 0.14 145)" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="oklch(0.62 0.14 145)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" opacity={0.3} />
                    <XAxis
                      dataKey="year"
                      label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
                      stroke="oklch(0.42 0.02 250)"
                      tick={{ fill: 'oklch(0.42 0.02 250)', fontSize: 12 }}
                    />
                    <YAxis
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      label={{ value: 'Portfolio Value', angle: -90, position: 'insideLeft' }}
                      stroke="oklch(0.42 0.02 250)"
                      tick={{ fill: 'oklch(0.42 0.02 250)', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(1 0 0)',
                        border: '1px solid oklch(0.922 0 0)',
                        borderRadius: '0.5rem',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Year ${label}`}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value) => {
                        const labels: Record<string, string> = {
                          p25: '25th Percentile (Pessimistic)',
                          p50: '50th Percentile (Median)',
                          p75: '75th Percentile (Optimistic)',
                        };
                        return labels[value] || value;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="p25"
                      stroke="oklch(0.52 0.18 25)"
                      strokeWidth={2}
                      fill="url(#colorP25)"
                      animationDuration={1000}
                    />
                    <Area
                      type="monotone"
                      dataKey="p50"
                      stroke="oklch(0.55 0.12 240)"
                      strokeWidth={3}
                      fill="url(#colorP50)"
                      animationDuration={1000}
                    />
                    <Area
                      type="monotone"
                      dataKey="p75"
                      stroke="oklch(0.62 0.14 145)"
                      strokeWidth={2}
                      fill="url(#colorP75)"
                      animationDuration={1000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3">Projected Outcomes After {years} Years</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 border border-border rounded-lg bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Pessimistic (25%)</span>
                      <Badge variant="destructive" className="text-xs">
                        {formatPercent(projectionStats.p25Return)}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(projectionStats.p25Value)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      25% chance of lower value
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 border-2 border-accent rounded-lg bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Median (50%)</span>
                      <Badge variant="default" className="text-xs">
                        {formatPercent(projectionStats.p50Return)}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(projectionStats.p50Value)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Most likely outcome
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 border border-border rounded-lg bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Optimistic (75%)</span>
                      <Badge className="text-xs bg-success text-success-foreground">
                        {formatPercent(projectionStats.p75Return)}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(projectionStats.p75Value)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      25% chance of higher value
                    </p>
                  </motion.div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="text-sm font-semibold mb-2">Understanding the Simulation</h4>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>This simulation projects {iterations.toLocaleString()} possible future scenarios based on historical market volatility and returns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>The median (50th percentile) represents the most probable outcome if historical patterns continue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>Results assume consistent market conditions and don't account for contributions, withdrawals, or major economic shifts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>Past performance doesn't guarantee future results - use this as a planning tool, not a prediction</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          )}

          {!isRunning && !hasRun && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 border-2 border-dashed border-border rounded-lg"
            >
              <div className="inline-flex p-6 bg-muted/50 rounded-full mb-4">
                <ChartBarHorizontal size={48} className="text-muted-foreground" weight="light" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Project Your Portfolio's Future</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                Configure your parameters above and click "Run Simulation" to see thousands of potential portfolio outcomes
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
