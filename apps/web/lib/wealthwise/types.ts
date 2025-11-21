export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  lastUpdated: string;
}

export interface NewsArticle {
  id: string;
  headline: string;
  source: string;
  url: string;
  summary: string;
  publishedAt: string;
  relatedSymbols: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  aiSummary?: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export type AssetType = 'stock' | 'etf' | 'bond' | 'mutual-fund';
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';
export type FundCategory = 'equity' | 'fixed-income' | 'balanced' | 'index' | 'sector' | 'international' | 'money-market';

export interface Fund {
  symbol: string;
  name: string;
  type: 'etf' | 'mutual-fund';
  category: FundCategory;
  price: number;
  change: number;
  changePercent: number;
  nav: number;
  totalAssets: number;
  expenseRatio: number;
  ytdReturn: number;
  oneYearReturn: number;
  threeYearReturn: number;
  fiveYearReturn: number;
  beta: number;
  sharpeRatio: number;
  dividendYield: number;
  morningstarRating: number;
  inceptionDate: string;
  minimumInvestment: number;
  holdings: number;
  turnoverRate: number;
  lastUpdated: string;
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  currentPrice?: number;
  currentValue?: number;
  gainLoss?: number;
  gainLossPercent?: number;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  holdings: Holding[];
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioAllocation {
  assetClass: string;
  value: number;
  percentage: number;
  color: string;
}

export interface RiskMetrics {
  volatility: number;
  beta: number;
  sharpeRatio: number;
  maxDrawdown: number;
  healthScore: number;
}

export interface AIInsight {
  id: string;
  type: 'recommendation' | 'warning' | 'opportunity';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string;
  confidence: number;
  actionable: boolean;
  actions?: string[];
  relatedSymbols?: string[];
  createdAt: string;
  dismissed?: boolean;
  implemented?: boolean;
}

export interface OptimizationSuggestion {
  action: 'buy' | 'sell' | 'rebalance';
  symbol: string;
  currentAllocation: number;
  targetAllocation: number;
  reason: string;
  expectedImpact: {
    risk: number;
    return: number;
  };
}

export interface SimulationScenario {
  id: string;
  name: string;
  type: 'market_crash' | 'recession' | 'inflation' | 'interest_rate' | 'custom';
  parameters: {
    marketDrop?: number;
    duration?: number;
    inflationRate?: number;
    interestRate?: number;
  };
}

export interface SimulationResult {
  scenario: SimulationScenario;
  initialValue: number;
  projectedValue: number;
  maxDrawdown: number;
  recoveryTime: number;
  confidenceInterval: {
    lower: number;
    median: number;
    upper: number;
  };
  timeline?: Array<{ month: number; value: number }>;
  assetImpact?: Record<string, number>;
  recommendations?: string[];
}

export interface TaxOpportunity {
  id: string;
  type: 'tax_loss_harvesting' | 'capital_gains';
  holding: Holding;
  potentialSavings: number;
  description: string;
  steps: string[];
}

export interface Alert {
  id: string;
  type: 'drift' | 'price' | 'rebalance' | 'tax' | 'market';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}
