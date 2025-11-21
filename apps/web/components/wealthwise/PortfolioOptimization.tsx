'use client'

import { useState } from 'react'
import { Portfolio, RiskProfile, OptimizationSuggestion } from '@/lib/wealthwise/types'
import { Button, Card, Badge } from '@/components/ui'
import { generateOptimizationSuggestions } from '@/lib/wealthwise/ai-insights'
import { calculateEfficientFrontier } from '@/lib/wealthwise/simulation'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'
import { Target, TrendUp, ArrowUp, ArrowDown } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface PortfolioOptimizationProps {
  portfolio: Portfolio
  riskProfile: RiskProfile
  onRiskProfileChange: (profile: RiskProfile) => void
}

export function PortfolioOptimization({ portfolio, riskProfile, onRiskProfileChange }: PortfolioOptimizationProps) {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])
  const [efficientFrontier, setEfficientFrontier] = useState<{ risk: number; return: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRiskProfile, setSelectedRiskProfile] = useState<RiskProfile>(riskProfile)

  const handleOptimize = () => {
    setLoading(true)
    try {
      const suggestions = generateOptimizationSuggestions(portfolio, selectedRiskProfile)
      const frontier = calculateEfficientFrontier(portfolio)
      
      setSuggestions(suggestions)
      setEfficientFrontier(frontier)
      onRiskProfileChange(selectedRiskProfile)
    } catch (error) {
      console.error('Optimization error:', error)
    } finally {
      setLoading(false)
    }
  }
  const riskProfiles: RiskProfile[] = ['conservative', 'moderate', 'aggressive']

  const riskProfileDescriptions: Record<RiskProfile, { stocks: number; bonds: number; description: string }> = {
    conservative: {
      stocks: 30,
      bonds: 70,
      description: 'Low risk, focus on capital preservation. Best for investors near retirement.',
    },
    moderate: {
      stocks: 60,
      bonds: 40,
      description: 'Balanced approach, suitable for most investors with long-term goals.',
    },
    aggressive: {
      stocks: 80,
      bonds: 20,
      description: 'High growth potential, suitable for young investors with long time horizons.',
    },
  }

  return (
    <div className="space-y-6">
      {/* Risk Profile Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target size={20} weight="bold" />
          Risk Profile Selection
        </h3>

        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {riskProfiles.map((profile) => (
              <button
                key={profile}
                onClick={() => setSelectedRiskProfile(profile)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedRiskProfile === profile
                    ? 'border-primary bg-accent/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold capitalize">{profile}</span>
                  {selectedRiskProfile === profile && <Badge variant="default">Selected</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {riskProfileDescriptions[profile].description}
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Stocks:</span>
                    <span className="font-semibold">{riskProfileDescriptions[profile].stocks}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bonds:</span>
                    <span className="font-semibold">{riskProfileDescriptions[profile].bonds}%</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <Button onClick={handleOptimize} disabled={loading || portfolio.holdings.length === 0} size="lg" className="w-full">
            <TrendUp size={16} className="mr-2" weight="bold" />
            {loading ? 'Optimizing...' : 'Optimize Portfolio'}
          </Button>
        </div>
      </Card>

      {/* Current Allocation vs Target */}
      {suggestions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Current vs Target Allocation</h3>
          <div className="space-y-4">
            {suggestions.map((suggestion, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-lg bg-muted/30 border border-border"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold capitalize flex items-center gap-2">
                      {suggestion.symbol}
                      <Badge variant="outline" className="text-xs">
                        {suggestion.action.toUpperCase()}
                      </Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Current Allocation</span>
                    <p className="text-lg font-semibold">{suggestion.currentAllocation.toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Target Allocation</span>
                    <p className="text-lg font-semibold">{suggestion.targetAllocation.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Risk Impact:</span>
                    <div className="flex items-center gap-1 mt-1">
                      {suggestion.expectedImpact.risk > 0 ? (
                        <ArrowUp size={14} className="text-destructive" />
                      ) : (
                        <ArrowDown size={14} className="text-success" />
                      )}
                      <span className={suggestion.expectedImpact.risk > 0 ? 'text-destructive' : 'text-success'}>
                        {Math.abs(suggestion.expectedImpact.risk).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Return Impact:</span>
                    <div className="flex items-center gap-1 mt-1">
                      {suggestion.expectedImpact.return > 0 ? (
                        <ArrowUp size={14} className="text-success" />
                      ) : (
                        <ArrowDown size={14} className="text-destructive" />
                      )}
                      <span className={suggestion.expectedImpact.return > 0 ? 'text-success' : 'text-destructive'}>
                        {Math.abs(suggestion.expectedImpact.return).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Efficient Frontier Chart */}
      {efficientFrontier.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Efficient Frontier</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Shows the optimal risk-return trade-off. Move along this curve to find your ideal investment mix.
          </p>
          <div className="bg-muted/30 rounded-lg p-4">
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="risk" label={{ value: 'Risk (%)', position: 'insideBottomRight', offset: -10 }} />
                <YAxis label={{ value: 'Expected Return (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Portfolio Options" data={efficientFrontier} fill="oklch(0.55 0.12 240)" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {suggestions.length === 0 && portfolio.holdings.length > 0 && (
        <Card className="p-12 text-center">
          <div className="inline-flex p-6 bg-muted/50 rounded-full mb-6">
            <Target size={48} className="text-muted-foreground" weight="light" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Optimization Yet</h3>
          <p className="text-muted-foreground mb-6">
            Select a risk profile and click &quot;Optimize Portfolio&quot; to get personalized rebalancing suggestions and see the efficient frontier.
          </p>
          <Button onClick={handleOptimize}>Start Optimization</Button>
        </Card>
      )}

      {portfolio.holdings.length === 0 && (
        <Card className="p-12 text-center">
          <div className="inline-flex p-6 bg-muted/50 rounded-full mb-6">
            <Target size={48} className="text-muted-foreground" weight="light" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Add Holdings First</h3>
          <p className="text-muted-foreground">
            Add some holdings to your portfolio to get optimization suggestions.
          </p>
        </Card>
      )}
    </div>
  )
}
