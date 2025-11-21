'use client'

import { useState, useEffect, useCallback } from 'react'
import { Toaster } from 'sonner'
import { toast } from 'sonner'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Button,
  ScrollArea,
  Skeleton,
} from '@/components/ui'
import {
  Briefcase,
  ChartLine,
  Lightbulb,
  GraduationCap,
  Receipt,
  Plus,
  Scales,
  Funnel,
  Vault,
  ArrowClockwise,
  Target,
  Bell,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'

// Import types and utilities
import {
  Stock,
  MarketIndex,
  Portfolio,
  RiskProfile,
  Holding,
  AIInsight,
  Fund,
} from '@/lib/wealthwise/types'
import {
  fetchAllStocks,
  fetchAllFunds,
  fetchMarketIndices,
  isMarketOpen,
} from '@/lib/wealthwise/api-service'
import {
  PortfolioCard,
  AddHoldingDialog,
  EditHoldingDialog,
  RiskMetricsCard,
  AIInsightCard,
  MarketIndexCard,
  MonteCarloSimulation,
  ScenarioTesting,
  EducationModuleCard,
  EducationDetail,
  FundCard,
  FundDetailDialog,
  DataFreshnessIndicator,
  StockDetailDialog,
  PortfolioOptimization,
  TaxCenter,
  Alerts,
} from '@/components/wealthwise'
import { PageLayout } from '@/components/layout/PageLayout'
import { updatePortfolio, calculateRiskMetrics, generatePortfolioId } from '@/lib/wealthwise/portfolio-utils'
import { generateAIInsights } from '@/lib/wealthwise/ai-insights'
import {
  educationModules,
  educationCategories,
  getModuleById,
  getRelatedModules,
} from '@/lib/wealthwise/education-content'

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'WealthWise Portfolio' },
]

function WealthWiseContent() {
  // State management
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null)
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('moderate')
  const [stocks, setStocks] = useState<Stock[]>([])
  const [funds, setFunds] = useState<Fund[]>([])
  const [indices, setIndices] = useState<MarketIndex[]>([])
  const [loading, setLoading] = useState(true)
  const [addHoldingOpen, setAddHoldingOpen] = useState(false)
  const [editHoldingOpen, setEditHoldingOpen] = useState(false)
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null)
  const [selectedStock] = useState<Stock | null>(null)
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [completedModules, setCompletedModules] = useState<string[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null)
  const [fundDialogOpen, setFundDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('portfolio')
  const [lastDataUpdate, setLastDataUpdate] = useState<string>(new Date().toISOString())
  const [refreshing, setRefreshing] = useState(false)

  const marketOpen = isMarketOpen()

  // Load market data
  const loadMarketData = useCallback(async (showToast = false) => {
    if (showToast) setRefreshing(true)

    try {
      const [newStocks, newFunds, newIndices] = await Promise.all([
        fetchAllStocks(),
        fetchAllFunds(),
        fetchMarketIndices(),
      ])

      setStocks(newStocks)
      setFunds(newFunds)
      setIndices(newIndices)
      setLastDataUpdate(new Date().toISOString())

      setPortfolios((currentPortfolios) => {
        if (!currentPortfolios || currentPortfolios.length === 0) return currentPortfolios || []
        return currentPortfolios.map((p) => updatePortfolio(p, newStocks, newFunds))
      })

      setLoading(false)
      if (showToast) toast.success('Market data refreshed')
    } catch {
      console.error('Failed to load market data')
      setLoading(false)
      toast.error('Failed to fetch market data. Using cached data.')
    } finally {
      if (showToast) setRefreshing(false)
    }
  }, [])

  // Initialize on mount
  useEffect(() => {
    loadMarketData()
    const interval = setInterval(() => loadMarketData(), 30000)
    return () => clearInterval(interval)
  }, [loadMarketData])

  // Load portfolios from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('wealthwise-portfolios')
    const savedModules = localStorage.getItem('wealthwise-completed-modules')
    const savedProfile = localStorage.getItem('wealthwise-risk-profile') as RiskProfile | null

    if (saved) {
      try {
        setPortfolios(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load portfolios:', e)
      }
    }

    if (savedModules) {
      try {
        setCompletedModules(JSON.parse(savedModules))
      } catch (e) {
        console.error('Failed to load completed modules:', e)
      }
    }

    if (savedProfile) {
      setRiskProfile(savedProfile)
    }
  }, [])

  // Save portfolios to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('wealthwise-portfolios', JSON.stringify(portfolios))
  }, [portfolios])

  // Save completed modules to localStorage
  useEffect(() => {
    localStorage.setItem('wealthwise-completed-modules', JSON.stringify(completedModules))
  }, [completedModules])

  // Save risk profile to localStorage
  useEffect(() => {
    localStorage.setItem('wealthwise-risk-profile', riskProfile)
  }, [riskProfile])

  // Set selected portfolio
  useEffect(() => {
    if (portfolios && portfolios.length > 0 && !selectedPortfolioId) {
      setSelectedPortfolioId(portfolios[0].id)
    }
  }, [portfolios, selectedPortfolioId])

  const selectedPortfolio = portfolios?.find((p) => p.id === selectedPortfolioId)

  const createDefaultPortfolio = () => {
    const newPortfolio: Portfolio = {
      id: generatePortfolioId(),
      name: 'My Portfolio',
      description: 'Main investment portfolio',
      holdings: [],
      totalValue: 0,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setPortfolios((current) => [...(current || []), newPortfolio])
    setSelectedPortfolioId(newPortfolio.id)
    toast.success('Portfolio created successfully')
  }

  const handleAddHolding = (holding: Holding) => {
    if (!selectedPortfolio) return

    let currentPrice = holding.purchasePrice

    if (holding.type === 'etf' || holding.type === 'mutual-fund') {
      const fund = funds.find((f) => f.symbol === holding.symbol)
      currentPrice = fund?.price || holding.purchasePrice
    } else {
      const stock = stocks.find((s) => s.symbol === holding.symbol)
      currentPrice = stock?.price || holding.purchasePrice
    }

    const updatedHolding = {
      ...holding,
      currentPrice,
      currentValue: holding.quantity * currentPrice,
      gainLoss: (currentPrice - holding.purchasePrice) * holding.quantity,
      gainLossPercent: ((currentPrice - holding.purchasePrice) / holding.purchasePrice) * 100,
    }

    setPortfolios((current) => {
      return (current || []).map((p) => {
        if (p.id === selectedPortfolio.id) {
          const updatedHoldings = [...p.holdings, updatedHolding]
          const updatedPortfolio = { ...p, holdings: updatedHoldings }
          return updatePortfolio(updatedPortfolio, stocks, funds)
        }
        return p
      })
    })

    const assetType = holding.type === 'etf' || holding.type === 'mutual-fund' ? 'fund' : 'stock'
    toast.success(`Added ${holding.symbol} ${assetType} to portfolio`)
  }

  const handleEditHolding = (updatedHolding: Holding) => {
    if (!selectedPortfolio) return

    let currentPrice = updatedHolding.purchasePrice

    if (updatedHolding.type === 'etf' || updatedHolding.type === 'mutual-fund') {
      const fund = funds.find((f) => f.symbol === updatedHolding.symbol)
      currentPrice = fund?.price || updatedHolding.purchasePrice
    } else {
      const stock = stocks.find((s) => s.symbol === updatedHolding.symbol)
      currentPrice = stock?.price || updatedHolding.purchasePrice
    }

    const recalculatedHolding = {
      ...updatedHolding,
      currentPrice,
      currentValue: updatedHolding.quantity * currentPrice,
      gainLoss: (currentPrice - updatedHolding.purchasePrice) * updatedHolding.quantity,
      gainLossPercent: ((currentPrice - updatedHolding.purchasePrice) / updatedHolding.purchasePrice) * 100,
    }

    setPortfolios((current) => {
      return (current || []).map((p) => {
        if (p.id === selectedPortfolio.id) {
          const updatedHoldings = p.holdings.map((h) => (h.id === updatedHolding.id ? recalculatedHolding : h))
          const updatedPortfolio = { ...p, holdings: updatedHoldings }
          return updatePortfolio(updatedPortfolio, stocks, funds)
        }
        return p
      })
    })

    toast.success(`Updated ${updatedHolding.symbol} position`)
  }

  const handleDeleteHolding = (holdingId: string) => {
    if (!selectedPortfolio) return

    const holding = selectedPortfolio.holdings.find((h) => h.id === holdingId)

    setPortfolios((current) => {
      return (current || []).map((p) => {
        if (p.id === selectedPortfolio.id) {
          const updatedHoldings = p.holdings.filter((h) => h.id !== holdingId)
          const updatedPortfolio = { ...p, holdings: updatedHoldings }
          return updatePortfolio(updatedPortfolio, stocks, funds)
        }
        return p
      })
    })

    if (holding) {
      toast.success(`Removed ${holding.symbol} from portfolio`)
    }
  }

  const loadAIInsights = async () => {
    if (!selectedPortfolio || selectedPortfolio.holdings.length === 0) {
      toast.error('Add holdings to your portfolio to get AI insights')
      return
    }

    setLoadingInsights(true)
    try {
      const metrics = calculateRiskMetrics(selectedPortfolio.holdings)
      const generatedInsights = await generateAIInsights(selectedPortfolio, metrics, riskProfile || 'moderate')
      setInsights(generatedInsights)
      toast.success(`Generated ${generatedInsights.length} AI insights`)
    } catch {
      toast.error('Failed to generate insights')
    } finally {
      setLoadingInsights(false)
    }
  }

  const handleDismissInsight = (id: string) => {
    setInsights((current) => current.map((i) => (i.id === id ? { ...i, dismissed: true } : i)))
    toast.success('Insight dismissed')
  }

  const handleImplementInsight = (id: string) => {
    setInsights((current) => current.map((i) => (i.id === id ? { ...i, implemented: true } : i)))
    toast.success('Marked as implemented')
  }

  const activeInsights = insights.filter((i) => !i.dismissed)
  const selectedModule = selectedModuleId ? getModuleById(selectedModuleId) : null
  const relatedModules = selectedModuleId ? getRelatedModules(selectedModuleId) : []

  const filteredModules = educationModules.filter((module) => {
    const categoryMatch = categoryFilter === 'all' || module.category === categoryFilter
    const levelMatch = levelFilter === 'all' || module.level === levelFilter
    return categoryMatch && levelMatch
  })

  const handleCompleteModule = (moduleId: string) => {
    setCompletedModules((current) => {
      if (!current) return [moduleId]
      if (current.includes(moduleId)) return current
      return [...current, moduleId]
    })
    toast.success('Module completed! Keep learning.')
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />

      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Scales size={24} className="text-primary-foreground" weight="bold" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">WealthWise</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Investment Portfolio Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DataFreshnessIndicator lastUpdated={lastDataUpdate} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => loadMarketData(true)}
                disabled={refreshing}
                className="shrink-0"
              >
                <ArrowClockwise size={20} weight="bold" className={refreshing ? 'animate-spin' : ''} />
              </Button>
              <Badge variant={marketOpen ? 'default' : 'secondary'} className="shrink-0">
                <span
                  className={
                    marketOpen
                      ? 'market-status-live inline-block w-2 h-2 rounded-full bg-success mr-2'
                      : 'inline-block w-2 h-2 rounded-full bg-muted-foreground mr-2'
                  }
                />
                {marketOpen ? 'Open' : 'Closed'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
            <ChartLine size={20} weight="bold" />
            Market Indices
          </h2>
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {loading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 min-w-[180px]" />
                  ))}
                </>
              ) : (
                indices.map((index) => <MarketIndexCard key={index.symbol} index={index} />)
              )}
            </div>
          </ScrollArea>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-grid grid-cols-7 w-full">
              <TabsTrigger value="portfolio">
                <Briefcase size={16} className="mr-0 sm:mr-2" weight="bold" />
                <span className="hidden sm:inline">Portfolio</span>
              </TabsTrigger>
              <TabsTrigger value="funds">
                <Vault size={16} className="mr-0 sm:mr-2" weight="bold" />
                <span className="hidden sm:inline">Funds</span>
              </TabsTrigger>
              <TabsTrigger value="optimization">
                <Target size={16} className="mr-0 sm:mr-2" weight="bold" />
                <span className="hidden sm:inline">Optimize</span>
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <ChartLine size={16} className="mr-0 sm:mr-2" weight="bold" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="insights">
                <Lightbulb size={16} className="mr-0 sm:mr-2" weight="bold" />
                <span className="hidden sm:inline">Insights</span>
              </TabsTrigger>
              <TabsTrigger value="taxes">
                <Receipt size={16} className="mr-0 sm:mr-2" weight="bold" />
                <span className="hidden sm:inline">Taxes</span>
              </TabsTrigger>
              <TabsTrigger value="alerts">
                <Bell size={16} className="mr-0 sm:mr-2" weight="bold" />
                <span className="hidden sm:inline">Alerts</span>
              </TabsTrigger>
              <TabsTrigger value="learn" className="col-span-1 sm:col-span-1">
                <GraduationCap size={16} className="mr-0 sm:mr-2" weight="bold" />
                <span className="hidden sm:inline">Learn</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            {!portfolios || portfolios.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="inline-flex p-6 bg-muted/50 rounded-full mb-6">
                  <Briefcase size={48} className="text-muted-foreground" weight="light" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Start Building Your Portfolio</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  Create your first portfolio to track investments, analyze risk, and get AI-powered insights for better decision-making.
                </p>
                <Button size="lg" onClick={createDefaultPortfolio} className="deliberate-action">
                  <Plus size={20} className="mr-2" weight="bold" />
                  Create Your First Portfolio
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {selectedPortfolio && (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Portfolio Overview</h2>
                      <Button onClick={() => setAddHoldingOpen(true)}>
                        <Plus size={16} className="mr-2" weight="bold" />
                        Add Position
                      </Button>
                    </div>

                    <PortfolioCard portfolio={selectedPortfolio} onClick={() => {}} selected={true} />

                    {selectedPortfolio.holdings.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                        <p className="text-muted-foreground mb-4">No holdings yet</p>
                        <Button variant="outline" onClick={() => setAddHoldingOpen(true)}>
                          <Plus size={16} className="mr-2" />
                          Add Your First Position
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="font-semibold">Holdings</h3>
                        <div className="space-y-3">
                          {selectedPortfolio.holdings.map((holding) => (
                            <div
                              key={holding.id}
                              className="p-4 border border-border rounded-lg hover:border-primary/50 hover:bg-accent/5 transition-all cursor-pointer"
                              onClick={() => {
                                setSelectedHolding(holding)
                                setEditHoldingOpen(true)
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{holding.symbol}</span>
                                    <Badge variant="outline" className="text-xs uppercase">
                                      {holding.type}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-0.5">{holding.name}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">
                                    ${(holding.currentValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                  <p className={`text-sm ${(holding.gainLoss || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                                    {(holding.gainLoss || 0) >= 0 ? '+' : ''}
                                    ${Math.abs(holding.gainLoss || 0).toFixed(2)} ({(holding.gainLossPercent || 0).toFixed(2)}%)
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-border text-sm">
                                <div>
                                  <span className="text-muted-foreground">Qty:</span> {holding.quantity}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Avg Cost:</span> ${holding.purchasePrice.toFixed(2)}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Current:</span> ${(holding.currentPrice || 0).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </TabsContent>

          {/* Funds Tab */}
          <TabsContent value="funds" className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Explore Investment Funds</h2>
                  <p className="text-sm text-muted-foreground">Browse ETFs and mutual funds to diversify your portfolio</p>
                </div>
              </div>

              {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-48" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Vault size={20} weight="bold" />
                      Exchange-Traded Funds (ETFs)
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {funds
                        .filter((f) => f.type === 'etf')
                        .map((fund) => (
                          <FundCard
                            key={fund.symbol}
                            fund={fund}
                            onClick={() => {
                              setSelectedFund(fund)
                              setFundDialogOpen(true)
                            }}
                          />
                        ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Briefcase size={20} weight="bold" />
                      Mutual Funds
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {funds
                        .filter((f) => f.type === 'mutual-fund')
                        .map((fund) => (
                          <FundCard
                            key={fund.symbol}
                            fund={fund}
                            onClick={() => {
                              setSelectedFund(fund)
                              setFundDialogOpen(true)
                            }}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {selectedPortfolio && selectedPortfolio.holdings.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Risk & Performance Analytics</h2>
                <RiskMetricsCard metrics={calculateRiskMetrics(selectedPortfolio.holdings)} />
                <ScenarioTesting portfolio={selectedPortfolio} />
                <MonteCarloSimulation portfolio={selectedPortfolio} />
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex p-6 bg-muted/50 rounded-full mb-6">
                  <ChartLine size={48} className="text-muted-foreground" weight="light" />
                </div>
                <h3 className="text-xl font-semibold mb-3">No Data to Analyze</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Add holdings to your portfolio to see risk metrics, performance analytics, and portfolio health scores.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">AI-Powered Insights</h2>
              <Button
                onClick={loadAIInsights}
                disabled={loadingInsights || !selectedPortfolio || selectedPortfolio.holdings.length === 0}
              >
                <Lightbulb size={16} className="mr-2" weight="bold" />
                {loadingInsights ? 'Analyzing...' : 'Generate Insights'}
              </Button>
            </div>

            {activeInsights.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex p-6 bg-muted/50 rounded-full mb-6">
                  <Lightbulb size={48} className="text-muted-foreground" weight="light" />
                </div>
                <h3 className="text-xl font-semibold mb-3">No Insights Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Get AI-powered recommendations to optimize your portfolio, identify risks, and discover opportunities.
                </p>
                {selectedPortfolio && selectedPortfolio.holdings.length > 0 && (
                  <Button onClick={loadAIInsights} disabled={loadingInsights}>
                    Generate Your First Insights
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {activeInsights.map((insight) => (
                  <AIInsightCard
                    key={insight.id}
                    insight={insight}
                    onDismiss={handleDismissInsight}
                    onImplement={handleImplementInsight}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Learning Tab */}
          <TabsContent value="learn" className="space-y-6">
            {selectedModule ? (
              <EducationDetail
                module={selectedModule}
                onBack={() => setSelectedModuleId(null)}
                onComplete={handleCompleteModule}
                completed={completedModules?.includes(selectedModule.id)}
                relatedModules={relatedModules}
                onSelectRelated={setSelectedModuleId}
              />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Investment Education Center</h2>
                    <p className="text-sm text-muted-foreground">Master stocks, bonds, ETFs, and wealth management strategies</p>
                  </div>
                  <Badge variant="secondary" className="gap-2">
                    <GraduationCap size={16} weight="bold" />
                    {completedModules?.length || 0} / {educationModules.length} Complete
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Funnel size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium">Category:</span>
                    <div className="flex gap-2">
                      <Button
                        variant={categoryFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCategoryFilter('all')}
                      >
                        All
                      </Button>
                      {educationCategories.map((cat) => (
                        <Button
                          key={cat.id}
                          variant={categoryFilter === cat.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCategoryFilter(cat.id)}
                        >
                          {cat.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Level:</span>
                  <div className="flex gap-2">
                    <Button
                      variant={levelFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLevelFilter('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={levelFilter === 'beginner' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLevelFilter('beginner')}
                    >
                      Beginner
                    </Button>
                    <Button
                      variant={levelFilter === 'intermediate' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLevelFilter('intermediate')}
                    >
                      Intermediate
                    </Button>
                    <Button
                      variant={levelFilter === 'advanced' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLevelFilter('advanced')}
                    >
                      Advanced
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredModules.map((module) => (
                    <EducationModuleCard
                      key={module.id}
                      module={module}
                      onSelect={setSelectedModuleId}
                      completed={completedModules?.includes(module.id)}
                    />
                  ))}
                </div>

                {filteredModules.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">No modules match your filters. Try adjusting your selection.</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Portfolio Optimization Tab */}
          <TabsContent value="optimization" className="space-y-6">
            {selectedPortfolio ? (
              <PortfolioOptimization portfolio={selectedPortfolio} riskProfile={riskProfile} onRiskProfileChange={setRiskProfile} />
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex p-6 bg-muted/50 rounded-full mb-6">
                  <Target size={48} className="text-muted-foreground" weight="light" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Create a Portfolio First</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Create a portfolio and add holdings to get optimization suggestions and efficient frontier analysis.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Tax Center Tab */}
          <TabsContent value="taxes" className="space-y-6">
            {selectedPortfolio && selectedPortfolio.holdings.length > 0 ? (
              <TaxCenter portfolio={selectedPortfolio} />
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex p-6 bg-muted/50 rounded-full mb-6">
                  <Receipt size={48} className="text-muted-foreground" weight="light" />
                </div>
                <h3 className="text-xl font-semibold mb-3">No Holdings to Analyze</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Add holdings to your portfolio to see tax opportunities, capital gains estimates, and fee analysis.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            {selectedPortfolio ? (
              <Alerts portfolio={selectedPortfolio} riskProfile={riskProfile} />
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex p-6 bg-muted/50 rounded-full mb-6">
                  <Bell size={48} className="text-muted-foreground" weight="light" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Create a Portfolio First</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Create a portfolio to receive personalized alerts about portfolio drift, diversification, and tax opportunities.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <AddHoldingDialog open={addHoldingOpen} onOpenChange={setAddHoldingOpen} onAdd={handleAddHolding} />

      <EditHoldingDialog
        holding={selectedHolding}
        open={editHoldingOpen}
        onOpenChange={setEditHoldingOpen}
        onSave={handleEditHolding}
        onDelete={handleDeleteHolding}
      />

      <FundDetailDialog fund={selectedFund} open={fundDialogOpen} onOpenChange={setFundDialogOpen} />

      <StockDetailDialog stock={selectedStock} open={stockDialogOpen} onOpenChange={setStockDialogOpen} />
    </div>
  )
}

export default function WealthWisePage() {
  return (
    <PageLayout
      title="WealthWise"
      description="Advanced investment portfolio management and analysis"
      breadcrumbs={breadcrumbs}
    >
      <WealthWiseContent />
    </PageLayout>
  )
}
