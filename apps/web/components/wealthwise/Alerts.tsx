'use client'

import { useState, useEffect } from 'react'
import { Portfolio, Alert, RiskProfile } from '@/lib/wealthwise/types'
import { Button, Card, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { calculateAllocation } from '@/lib/wealthwise/portfolio-utils'
import { detectPortfolioDrift } from '@/lib/wealthwise/portfolio-utils'
import { Warning, CheckCircle, Info, Bell, Clock } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface AlertsProps {
  portfolio: Portfolio
  riskProfile: RiskProfile
}

export function Alerts({ portfolio, riskProfile }: AlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [readAlerts, setReadAlerts] = useState<string[]>([])

  // Generate alerts based on portfolio state
  useEffect(() => {
    const generatedAlerts: Alert[] = []

    if (!portfolio || portfolio.holdings.length === 0) {
      return
    }

    // Check for portfolio drift
    const allocation = calculateAllocation(portfolio.holdings)
    const targetAllocations = {
      conservative: { stock: 30, etf: 20, bond: 50 },
      moderate: { stock: 60, etf: 30, bond: 20 },
      aggressive: { stock: 80, etf: 25, bond: 5 },
    }
    const targets = targetAllocations[riskProfile]

    const hasDrift = detectPortfolioDrift(allocation, targets)
    if (hasDrift) {
      generatedAlerts.push({
        id: 'drift-alert',
        type: 'drift',
        priority: 'medium',
        title: 'Portfolio Drift Detected',
        message: 'Your allocation has drifted more than 10% from your target allocation. Consider rebalancing.',
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: '#',
      })
    }

    // Check for high concentration
    const topHolding = portfolio.holdings.reduce((max, h) => 
      ((h.currentValue || 0) > (max.currentValue || 0)) ? h : max
    )
    const topHoldingPercent = ((topHolding.currentValue || 0) / portfolio.totalValue) * 100
    if (topHoldingPercent > 25) {
      generatedAlerts.push({
        id: 'concentration-alert',
        type: 'price',
        priority: 'high',
        title: 'High Position Concentration',
        message: `${topHolding.symbol} represents ${topHoldingPercent.toFixed(1)}% of your portfolio. Consider reducing concentration.`,
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: '#',
      })
    }

    // Check for rebalancing recommendation
    const needsRebalancing = generatedAlerts.some(a => a.type === 'drift')
    if (needsRebalancing) {
      generatedAlerts.push({
        id: 'rebalance-alert',
        type: 'rebalance',
        priority: 'medium',
        title: 'Rebalancing Opportunity',
        message: 'Your portfolio has drifted from target allocation. Run the Portfolio Optimization tool for suggestions.',
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: '#',
      })
    }

    // Check for underallocation in bonds
    const bondAllocation = allocation
      .filter(a => a.assetClass === 'BOND')
      .reduce((sum, a) => sum + a.percentage, 0)

    const targetBondAllocation = targets.bond
    if (bondAllocation < targetBondAllocation * 0.8) {
      generatedAlerts.push({
        id: 'bond-allocation-alert',
        type: 'market',
        priority: 'low',
        title: 'Below-Target Bond Allocation',
        message: `Your bond allocation is ${bondAllocation.toFixed(1)}%, below your target of ${targetBondAllocation}%. Consider adding bonds for stability.`,
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: '#',
      })
    }

    // Check for diversification
    if (portfolio.holdings.length < 5) {
      generatedAlerts.push({
        id: 'diversification-alert',
        type: 'market',
        priority: 'medium',
        title: 'Limited Diversification',
        message: `You have only ${portfolio.holdings.length} holdings. Consider adding more for better diversification (aim for 8-12).`,
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: '#',
      })
    }

    // Check for gains/losses that might trigger tax loss harvesting
    const lossPositions = portfolio.holdings.filter(h => (h.gainLoss || 0) < -500)
    if (lossPositions.length > 0) {
      generatedAlerts.push({
        id: 'tax-loss-alert',
        type: 'tax',
        priority: 'medium',
        title: 'Tax Loss Harvesting Opportunity',
        message: `You have ${lossPositions.length} position(s) with losses. Check the Tax Center for harvesting opportunities.`,
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: '#',
      })
    }

    setAlerts(generatedAlerts)
  }, [portfolio, riskProfile])

  const markAsRead = (alertId: string) => {
    setReadAlerts([...readAlerts, alertId])
  }

  const unreadAlerts = alerts.filter(a => !readAlerts.includes(a.id))
  const allReadAlerts = alerts.filter(a => readAlerts.includes(a.id))

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'drift':
        return <Warning size={20} weight="bold" className="text-amber-500" />
      case 'price':
        return <Warning size={20} weight="bold" className="text-red-500" />
      case 'tax':
        return <Info size={20} weight="bold" className="text-blue-500" />
      case 'rebalance':
        return <Bell size={20} weight="bold" className="text-purple-500" />
      default:
        return <Info size={20} weight="bold" className="text-gray-500" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>
      case 'medium':
        return <Badge variant="secondary">Medium Priority</Badge>
      default:
        return <Badge variant="outline">Low Priority</Badge>
    }
  }

  const AlertCard = ({ alert, isRead }: { alert: Alert; isRead: boolean }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-lg border transition-all ${
        isRead
          ? 'bg-muted/30 border-border opacity-60'
          : 'bg-card border-border hover:border-primary/50'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="pt-1">{getAlertIcon(alert.type)}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-semibold ${isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
              {alert.title}
            </h4>
            {getPriorityBadge(alert.priority)}
          </div>

          <p className={`text-sm mb-2 ${isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
            {alert.message}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock size={14} weight="bold" />
            <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {!isRead && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAsRead(alert.id)}
            >
              Mark Read
            </Button>
          )}
          {isRead && <CheckCircle size={20} className="text-success" weight="bold" />}
        </div>
      </div>
    </motion.div>
  )

  if (alerts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex p-6 bg-muted/50 rounded-full mb-6">
          <Bell size={48} className="text-muted-foreground" weight="light" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Alerts</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your portfolio is looking good! Alerts will appear here when action is recommended based on your portfolio state and risk profile.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="unread" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unread">
            Active {unreadAlerts.length > 0 && `(${unreadAlerts.length})`}
          </TabsTrigger>
          <TabsTrigger value="all">All Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="space-y-3">
          {unreadAlerts.length > 0 ? (
            unreadAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} isRead={false} />
            ))
          ) : (
            <Card className="p-8 text-center">
              <CheckCircle size={32} className="mx-auto mb-3 text-success" weight="bold" />
              <p className="text-muted-foreground">No active alerts. Your portfolio is in good shape!</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-3">
          {unreadAlerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} isRead={false} />
          ))}
          {allReadAlerts.length > 0 && (
            <>
              <h3 className="font-semibold text-sm text-muted-foreground mt-6">Previously Reviewed</h3>
              {allReadAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} isRead={true} />
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Alert Preferences */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Alert Preferences</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Currently, alerts are automatically generated based on your portfolio state. In the future, you&apos;ll be able to customize which alerts to receive.
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 rounded border border-border bg-muted/30">
            <input type="checkbox" id="drift-pref" defaultChecked className="h-4 w-4" />
            <label htmlFor="drift-pref" className="text-sm cursor-pointer flex-1">
              Portfolio drift alerts (allocation changes &gt;10%)
            </label>
          </div>
          <div className="flex items-center gap-2 p-3 rounded border border-border bg-muted/30">
            <input type="checkbox" id="concentration-pref" defaultChecked className="h-4 w-4" />
            <label htmlFor="concentration-pref" className="text-sm cursor-pointer flex-1">
              High concentration alerts (single position &gt;25%)
            </label>
          </div>
          <div className="flex items-center gap-2 p-3 rounded border border-border bg-muted/30">
            <input type="checkbox" id="tax-pref" defaultChecked className="h-4 w-4" />
            <label htmlFor="tax-pref" className="text-sm cursor-pointer flex-1">
              Tax loss harvesting opportunities
            </label>
          </div>
          <div className="flex items-center gap-2 p-3 rounded border border-border bg-muted/30">
            <input type="checkbox" id="diversification-pref" defaultChecked className="h-4 w-4" />
            <label htmlFor="diversification-pref" className="text-sm cursor-pointer flex-1">
              Diversification recommendations
            </label>
          </div>
        </div>
      </Card>
    </div>
  )
}
