import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Portfolio, SimulationScenario } from '@/lib/wealthwise/types';
import { runScenarioSimulation, predefinedScenarios, runDetailedScenarioSimulation } from '@/lib/wealthwise/simulation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { 
  TrendDown, 
  Lightning, 
  Fire, 
  Percent,
  Play,
  CaretDown,
  CaretUp,
  Warning,
  ChartLine
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ScenarioTestingProps {
  portfolio: Portfolio;
}

export function ScenarioTesting({ portfolio }: ScenarioTestingProps) {
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario | null>(null);
  const [customParams, setCustomParams] = useState({
    marketDrop: 30,
    duration: 6,
    inflationRate: 8,
    interestRate: 6,
  });
  const [hasRun, setHasRun] = useState(false);

  const getScenarioIcon = (type: SimulationScenario['type']) => {
    switch (type) {
      case 'market_crash':
        return <TrendDown size={20} weight="bold" />;
      case 'recession':
        return <Lightning size={20} weight="bold" />;
      case 'inflation':
        return <Fire size={20} weight="bold" />;
      case 'interest_rate':
        return <Percent size={20} weight="bold" />;
      default:
        return <ChartLine size={20} weight="bold" />;
    }
  };

  const getScenarioColor = (type: SimulationScenario['type']) => {
    switch (type) {
      case 'market_crash':
        return 'border-destructive bg-destructive/5';
      case 'recession':
        return 'border-warning bg-warning/5';
      case 'inflation':
        return 'border-orange-500 bg-orange-50';
      case 'interest_rate':
        return 'border-accent bg-accent/5';
      default:
        return 'border-border bg-card';
    }
  };

  const runTest = () => {
    if (!selectedScenario) return;
    setHasRun(true);
  };

  const simulationResult = useMemo(() => {
    if (!selectedScenario || !hasRun) return null;
    
    const scenario = {
      ...selectedScenario,
      parameters: {
        ...selectedScenario.parameters,
        ...customParams,
      },
    };
    
    return runDetailedScenarioSimulation(portfolio, scenario);
  }, [selectedScenario, hasRun, portfolio, customParams]);

  const chartData = useMemo(() => {
    if (!simulationResult) return [];
    return simulationResult.timeline;
  }, [simulationResult]);

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

  const ScenarioCard = ({ scenario }: { scenario: SimulationScenario }) => {
    const isSelected = selectedScenario?.id === scenario.id;
    
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setSelectedScenario(scenario);
          setHasRun(false);
        }}
        className={cn(
          'p-4 border-2 rounded-lg cursor-pointer transition-all',
          isSelected ? 'border-accent bg-accent/10 shadow-sm' : getScenarioColor(scenario.type),
          'hover:shadow-md'
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            scenario.type === 'market_crash' && 'bg-destructive/10 text-destructive',
            scenario.type === 'recession' && 'bg-warning/10 text-warning-foreground',
            scenario.type === 'inflation' && 'bg-orange-100 text-orange-700',
            scenario.type === 'interest_rate' && 'bg-accent/10 text-accent'
          )}>
            {getScenarioIcon(scenario.type)}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">{scenario.name}</h3>
            <div className="text-xs text-muted-foreground space-y-0.5">
              {scenario.parameters.marketDrop && (
                <p>Market Drop: {scenario.parameters.marketDrop}%</p>
              )}
              {scenario.parameters.inflationRate && (
                <p>Inflation Rate: {scenario.parameters.inflationRate}%</p>
              )}
              {scenario.parameters.interestRate && (
                <p>Interest Rate: {scenario.parameters.interestRate}%</p>
              )}
              {scenario.parameters.duration && (
                <p>Duration: {scenario.parameters.duration} months</p>
              )}
            </div>
          </div>
          {isSelected && (
            <div className="shrink-0">
              <Badge variant="default" className="text-xs">Selected</Badge>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Warning size={20} weight="bold" />
              Scenario Testing & Stress Analysis
            </CardTitle>
            <CardDescription>
              Test how your portfolio would perform under adverse market conditions
            </CardDescription>
          </div>
          {selectedScenario && (
            <Button
              onClick={runTest}
              className="deliberate-action"
            >
              <Play size={16} className="mr-2" weight="bold" />
              Run Test
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="predefined" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="predefined">Predefined Scenarios</TabsTrigger>
            <TabsTrigger value="custom">Custom Parameters</TabsTrigger>
          </TabsList>

          <TabsContent value="predefined" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predefinedScenarios.map((scenario) => (
                <ScenarioCard key={scenario.id} scenario={scenario} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6 mt-6">
            {selectedScenario && (
              <div className="space-y-6 p-6 border border-border rounded-lg bg-muted/30">
                <h3 className="font-semibold">Adjust Parameters for {selectedScenario.name}</h3>
                
                {(selectedScenario.type === 'market_crash' || selectedScenario.type === 'recession') && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Market Drop: {customParams.marketDrop}%
                    </Label>
                    <Slider
                      value={[customParams.marketDrop]}
                      onValueChange={(value) => setCustomParams({ ...customParams, marketDrop: value[0] })}
                      min={10}
                      max={60}
                      step={5}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10% (Mild)</span>
                      <span>60% (Severe)</span>
                    </div>
                  </div>
                )}

                {selectedScenario.type === 'inflation' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Inflation Rate: {customParams.inflationRate}%
                    </Label>
                    <Slider
                      value={[customParams.inflationRate]}
                      onValueChange={(value) => setCustomParams({ ...customParams, inflationRate: value[0] })}
                      min={3}
                      max={15}
                      step={0.5}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>3% (Moderate)</span>
                      <span>15% (Hyperinflation)</span>
                    </div>
                  </div>
                )}

                {selectedScenario.type === 'interest_rate' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Interest Rate: {customParams.interestRate}%
                    </Label>
                    <Slider
                      value={[customParams.interestRate]}
                      onValueChange={(value) => setCustomParams({ ...customParams, interestRate: value[0] })}
                      min={1}
                      max={10}
                      step={0.25}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1% (Low)</span>
                      <span>10% (High)</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Duration: {customParams.duration} months
                  </Label>
                  <Slider
                    value={[customParams.duration]}
                    onValueChange={(value) => setCustomParams({ ...customParams, duration: value[0] })}
                    min={3}
                    max={36}
                    step={3}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>3 months</span>
                    <span>36 months</span>
                  </div>
                </div>
              </div>
            )}

            {!selectedScenario && (
              <div className="text-center py-8 text-muted-foreground">
                Select a scenario from the Predefined tab to customize parameters
              </div>
            )}
          </TabsContent>
        </Tabs>

        <AnimatePresence mode="wait">
          {hasRun && simulationResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 border border-border rounded-lg bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Portfolio Impact</span>
                    <div className="flex items-center gap-1 text-destructive">
                      <CaretDown size={16} weight="bold" />
                      <span className="text-sm font-semibold">
                        {formatPercent(simulationResult.maxDrawdown * -1)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Current: {formatCurrency(simulationResult.initialValue)}</p>
                    <p className="text-2xl font-bold text-destructive">
                      {formatCurrency(simulationResult.projectedValue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Loss: {formatCurrency(simulationResult.initialValue - simulationResult.projectedValue)}
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 border border-border rounded-lg bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Recovery Time</span>
                    <Badge variant="outline" className="text-xs">
                      Estimated
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {simulationResult.recoveryTime} months
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Time to return to current value
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 border border-border rounded-lg bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Confidence Range</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Upper</span>
                      <span className="font-semibold">{formatCurrency(simulationResult.confidenceInterval.upper)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Median</span>
                      <span className="font-semibold">{formatCurrency(simulationResult.confidenceInterval.median)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Lower</span>
                      <span className="font-semibold">{formatCurrency(simulationResult.confidenceInterval.lower)}</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <h4 className="text-sm font-semibold mb-3">Portfolio Value Over Time</h4>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData}>
                    <defs>
                      <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.52 0.18 25)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="oklch(0.52 0.18 25)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" opacity={0.3} />
                    <XAxis
                      dataKey="month"
                      label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
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
                      formatter={(value: number) => [formatCurrency(value), 'Value']}
                      labelFormatter={(label) => `Month ${label}`}
                    />
                    <Legend />
                    <ReferenceLine
                      y={simulationResult.initialValue}
                      stroke="oklch(0.55 0.12 240)"
                      strokeDasharray="5 5"
                      label={{ value: 'Initial Value', position: 'right', fill: 'oklch(0.42 0.02 250)', fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="oklch(0.52 0.18 25)"
                      strokeWidth={3}
                      dot={false}
                      name="Portfolio Value"
                      animationDuration={1000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {simulationResult.assetImpact && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Impact by Asset Class</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.entries(simulationResult.assetImpact).map(([assetType, impact]) => {
                      const impactValue = impact as number;
                      return (
                        <div key={assetType} className="p-3 border border-border rounded-lg bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium capitalize">{assetType}</span>
                            <Badge variant={impactValue < -20 ? "destructive" : "secondary"} className="text-xs">
                              {formatPercent(impactValue)}
                            </Badge>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={cn(
                                "h-2 rounded-full transition-all",
                                impactValue < -20 ? "bg-destructive" : "bg-warning"
                              )}
                              style={{ width: `${Math.abs(impactValue)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-warning/10 border border-warning rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Warning size={20} className="text-warning-foreground mt-0.5" weight="bold" />
                  <div className="flex-1 space-y-2">
                    <h4 className="text-sm font-semibold">Understanding This Scenario</h4>
                    <ul className="text-sm text-muted-foreground space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="text-warning-foreground mt-0.5">•</span>
                        <span>This simulation models a {selectedScenario?.name.toLowerCase()} scenario lasting {customParams.duration} months</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-warning-foreground mt-0.5">•</span>
                        <span>Results assume gradual market decline followed by slow recovery - actual events may vary significantly</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-warning-foreground mt-0.5">•</span>
                        <span>Recovery time estimates are based on historical averages but individual outcomes depend on many factors</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-warning-foreground mt-0.5">•</span>
                        <span>Use this analysis to assess portfolio resilience and consider rebalancing to reduce risk exposure</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {simulationResult.recommendations && simulationResult.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Recommendations to Improve Resilience</h4>
                  <div className="space-y-2">
                    {simulationResult.recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="p-3 border border-border rounded-lg bg-card flex items-start gap-3"
                      >
                        <div className="p-1.5 rounded-lg bg-accent/10 text-accent shrink-0">
                          <CaretUp size={16} weight="bold" />
                        </div>
                        <p className="text-sm text-foreground">{rec}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {!hasRun && (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
              <div className="inline-flex p-6 bg-muted/50 rounded-full mb-4">
                <Warning size={48} className="text-muted-foreground" weight="light" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Test Your Portfolio</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {selectedScenario 
                  ? 'Click "Run Test" to see how your portfolio would perform in this scenario'
                  : 'Select a scenario above to begin stress testing your portfolio'
                }
              </p>
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
