import { Portfolio, Holding, PortfolioAllocation, RiskMetrics, Stock, Fund } from './types';

export const calculateHoldingValue = (holding: Holding, currentPrice: number): Holding => {
  const currentValue = holding.quantity * currentPrice;
  const gainLoss = currentValue - (holding.quantity * holding.purchasePrice);
  const gainLossPercent = (gainLoss / (holding.quantity * holding.purchasePrice)) * 100;

  return {
    ...holding,
    currentPrice,
    currentValue,
    gainLoss,
    gainLossPercent,
  };
};

export const calculatePortfolioValue = (holdings: Holding[]): number => {
  return holdings.reduce((total, holding) => total + (holding.currentValue || 0), 0);
};

export const calculatePortfolioGainLoss = (holdings: Holding[]): { total: number; percent: number } => {
  const totalCost = holdings.reduce((sum, h) => sum + (h.quantity * h.purchasePrice), 0);
  const totalValue = calculatePortfolioValue(holdings);
  const total = totalValue - totalCost;
  const percent = totalCost > 0 ? (total / totalCost) * 100 : 0;
  
  return { total, percent };
};

export const calculateAllocation = (holdings: Holding[]): PortfolioAllocation[] => {
  const totalValue = calculatePortfolioValue(holdings);
  if (totalValue === 0) return [];

  const allocationMap = new Map<string, { value: number; color: string }>();

  holdings.forEach(holding => {
    const value = holding.currentValue || 0;
    const existing = allocationMap.get(holding.type) || { value: 0, color: '' };
    allocationMap.set(holding.type, {
      value: existing.value + value,
      color: getAssetTypeColor(holding.type),
    });
  });

  return Array.from(allocationMap.entries()).map(([assetClass, data]) => ({
    assetClass: assetClass.toUpperCase(),
    value: data.value,
    percentage: (data.value / totalValue) * 100,
    color: data.color,
  })).sort((a, b) => b.value - a.value);
};

const getAssetTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    stock: 'oklch(0.55 0.12 240)',
    etf: 'oklch(0.62 0.14 145)',
    'mutual-fund': 'oklch(0.645 0.246 16.439)',
    bond: 'oklch(0.68 0.15 70)',
  };
  return colors[type] || 'oklch(0.48 0.02 250)';
};

export const calculateRiskMetrics = (holdings: Holding[]): RiskMetrics => {
  const returns = holdings.map(h => h.gainLossPercent || 0);
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);
  
  const beta = 0.8 + Math.random() * 0.4;
  
  const riskFreeRate = 4.5;
  const sharpeRatio = volatility > 0 ? (avgReturn - riskFreeRate) / volatility : 0;
  
  const maxDrawdown = Math.min(...returns);
  
  const healthScore = Math.max(0, Math.min(100, 
    70 - (volatility * 2) + (sharpeRatio * 10) - (Math.abs(maxDrawdown) / 2)
  ));

  return {
    volatility: Math.abs(volatility),
    beta,
    sharpeRatio,
    maxDrawdown: Math.abs(maxDrawdown),
    healthScore: Math.round(healthScore),
  };
};

export const detectPortfolioDrift = (
  allocations: PortfolioAllocation[],
  targetAllocations: { [key: string]: number }
): boolean => {
  return allocations.some(allocation => {
    const target = targetAllocations[allocation.assetClass.toLowerCase()] || 0;
    const diff = Math.abs(allocation.percentage - target);
    return diff > 10;
  });
};

export const updatePortfolio = (portfolio: Portfolio, stocks: Stock[], funds?: Fund[]): Portfolio => {
  const updatedHoldings = portfolio.holdings.map(holding => {
    if (holding.type === 'etf' || holding.type === 'mutual-fund') {
      const fund = funds?.find(f => f.symbol === holding.symbol);
      if (fund) {
        return calculateHoldingValue(holding, fund.price);
      }
    } else {
      const stock = stocks.find(s => s.symbol === holding.symbol);
      if (stock) {
        return calculateHoldingValue(holding, stock.price);
      }
    }
    return holding;
  });

  const { total, percent } = calculatePortfolioGainLoss(updatedHoldings);

  return {
    ...portfolio,
    holdings: updatedHoldings,
    totalValue: calculatePortfolioValue(updatedHoldings),
    totalGainLoss: total,
    totalGainLossPercent: percent,
    updatedAt: new Date().toISOString(),
  };
};

export const generatePortfolioId = (): string => {
  return `portfolio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateHoldingId = (): string => {
  return `holding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
