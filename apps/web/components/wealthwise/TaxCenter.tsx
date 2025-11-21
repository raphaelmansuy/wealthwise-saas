'use client'

import { Portfolio } from '@/lib/wealthwise/types'
import { Button, Card, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { identifyTaxLossHarvestingOpportunities, calculateTotalCapitalGains, calculateExpenseRatios } from '@/lib/wealthwise/tax-utils'
import { Receipt, TrendDown, Warning, Lightning } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface TaxCenterProps {
  portfolio: Portfolio
}

export function TaxCenter({ portfolio }: TaxCenterProps) {
  const taxOpportunities = identifyTaxLossHarvestingOpportunities(portfolio)
  const capitalGains = calculateTotalCapitalGains(portfolio)
  const expenseRatios = calculateExpenseRatios(portfolio)

  return (
    <div className="space-y-6">
      {/* Tax Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Short-Term Gains</p>
              <p className={`text-2xl font-bold ${capitalGains.shortTerm >= 0 ? 'text-success' : 'text-destructive'}`}>
                ${Math.abs(capitalGains.shortTerm).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <Receipt size={20} className="text-muted-foreground" weight="bold" />
          </div>
          <p className="text-xs text-muted-foreground mt-3">Held less than 1 year (short-term tax rate ~24%)</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Long-Term Gains</p>
              <p className={`text-2xl font-bold ${capitalGains.longTerm >= 0 ? 'text-success' : 'text-destructive'}`}>
                ${Math.abs(capitalGains.longTerm).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <TrendDown size={20} className="text-muted-foreground" weight="bold" />
          </div>
          <p className="text-xs text-muted-foreground mt-3">Held more than 1 year (long-term tax rate ~15%)</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Estimated Tax Liability</p>
              <p className="text-2xl font-bold text-destructive">
                ${capitalGains.estimatedTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <Warning size={20} className="text-destructive" weight="bold" />
          </div>
          <p className="text-xs text-muted-foreground mt-3">Estimated federal tax on realized gains</p>
        </Card>
      </div>

      {/* Tax Loss Harvesting Opportunities */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lightning size={20} weight="bold" className="text-amber-500" />
          Tax Loss Harvesting Opportunities
        </h3>

        {taxOpportunities.length > 0 ? (
          <div className="space-y-4">
            {taxOpportunities.map((opportunity, idx) => (
              <motion.div
                key={opportunity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100">{opportunity.holding.symbol}</h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">{opportunity.description}</p>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
                    Save ${opportunity.potentialSavings.toFixed(2)}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Implementation Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-amber-800 dark:text-amber-200">
                    {opportunity.steps.map((step, stepIdx) => (
                      <li key={stepIdx}>{step}</li>
                    ))}
                  </ol>
                </div>

                <Button variant="outline" size="sm" className="border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900">
                  Learn More
                </Button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">No tax loss harvesting opportunities available right now.</p>
            <p className="text-sm text-muted-foreground">Your portfolio is showing positive gains across all holdings.</p>
          </div>
        )}
      </Card>

      {/* Expense Ratios & Fees */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Annual Costs & Fees</h3>

        <Tabs defaultValue="annual" className="space-y-4">
          <TabsList>
            <TabsTrigger value="annual">Annual</TabsTrigger>
            <TabsTrigger value="longterm">10-Year Impact</TabsTrigger>
          </TabsList>

          <TabsContent value="annual" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <p className="text-sm text-muted-foreground mb-2">Average Expense Ratio</p>
                <p className="text-2xl font-bold">{(expenseRatios.total * 100).toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Weighted average of all holdings&apos; expense ratios
                </p>
              </div>

              <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900">
                <p className="text-sm text-muted-foreground mb-2">Annual Cost</p>
                <p className="text-2xl font-bold text-destructive">
                  ${expenseRatios.annual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-destructive/70 mt-2">
                  Based on current portfolio value of ${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Tip: Lower expense ratios compound over time</p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Consider replacing high-fee funds with low-cost index funds. Saving 0.5% annually adds up to significant wealth over decades.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="longterm" className="space-y-4">
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900">
              <p className="text-sm text-muted-foreground mb-2">10-Year Cost Impact</p>
              <p className="text-3xl font-bold text-destructive">
                ${expenseRatios.tenYear.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-destructive/70 mt-2">
                Cumulative cost over 10 years assuming 7% annual growth
              </p>
            </div>

            <div className="p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900">
              <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-3">
                Impact of Reducing Expense Ratios:
              </p>
              <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
                <div className="flex justify-between">
                  <span>Reduce by 0.25%:</span>
                  <span className="font-semibold">
                    Save ~${(expenseRatios.tenYear * 0.25 / expenseRatios.total).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Reduce by 0.5%:</span>
                  <span className="font-semibold">
                    Save ~${(expenseRatios.tenYear * 0.5 / expenseRatios.total).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Tax Tips */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tax Strategy Tips</h3>

        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <p className="font-medium text-sm mb-2">🔄 Wash Sale Rule</p>
            <p className="text-sm text-muted-foreground">
              After selling at a loss, wait 30 days before buying substantially identical securities, or you&apos;ll lose the tax deduction.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <p className="font-medium text-sm mb-2">🎯 Long-Term Capital Gains</p>
            <p className="text-sm text-muted-foreground">
              Hold investments for 1+ year to qualify for long-term capital gains rates (~15% vs 24% short-term).
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <p className="font-medium text-sm mb-2">📋 Tax-Deferred Accounts</p>
            <p className="text-sm text-muted-foreground">
              Maximize contributions to 401(k)s and IRAs to defer taxes and reduce your current tax liability.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <p className="font-medium text-sm mb-2">🏦 Asset Location</p>
            <p className="text-sm text-muted-foreground">
              Keep tax-efficient index funds in taxable accounts and actively managed funds in tax-deferred accounts.
            </p>
          </div>
        </div>
      </Card>

      {/* Disclaimer */}
      <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
        <p className="text-xs text-amber-900 dark:text-amber-100">
          ⚠️ <strong>Disclaimer:</strong> This tax information is for educational purposes only and not professional tax advice. Please consult with a qualified tax professional or CPA before making any tax-related decisions.
        </p>
      </Card>
    </div>
  )
}
