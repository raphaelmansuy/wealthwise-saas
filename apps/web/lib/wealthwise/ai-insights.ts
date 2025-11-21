import { AIInsight, Portfolio, RiskProfile, OptimizationSuggestion, RiskMetrics } from './types';

export const generateAIInsights = async (
  portfolio: Portfolio,
  riskMetrics: RiskMetrics,
  userRiskProfile: RiskProfile
): Promise<AIInsight[]> => {
  const insights: AIInsight[] = [];

  if (riskMetrics.healthScore < 50) {
    insights.push({
      id: `insight-${Date.now()}-1`,
      type: 'warning',
      priority: 'high',
      title: 'Portfolio Health Score Below Target',
      description: `Your portfolio health score is ${riskMetrics.healthScore}/100, indicating elevated risk levels.`,
      reasoning: 'High volatility and negative Sharpe ratio suggest the portfolio may not be adequately compensating you for the risk taken.',
      confidence: 85,
      actionable: true,
      actions: ['Review asset allocation', 'Consider diversification', 'Reduce high-volatility positions'],
      createdAt: new Date().toISOString(),
    });
  }

  if (riskMetrics.volatility > 20) {
    insights.push({
      id: `insight-${Date.now()}-2`,
      type: 'recommendation',
      priority: 'medium',
      title: 'High Volatility Detected',
      description: `Portfolio volatility is ${riskMetrics.volatility.toFixed(1)}%, above recommended levels for ${userRiskProfile} investors.`,
      reasoning: 'Excessive volatility can lead to emotional decision-making during market downturns.',
      confidence: 78,
      actionable: true,
      actions: ['Add bonds or defensive stocks', 'Reduce concentration in tech sector', 'Consider index funds for stability'],
      createdAt: new Date().toISOString(),
    });
  }

  const stockConcentration = portfolio.holdings.filter(h => h.type === 'stock').length / portfolio.holdings.length;
  if (stockConcentration > 0.8 && userRiskProfile !== 'aggressive') {
    insights.push({
      id: `insight-${Date.now()}-3`,
      type: 'recommendation',
      priority: 'medium',
      title: 'Consider Adding Bonds for Stability',
      description: `Your portfolio is ${(stockConcentration * 100).toFixed(0)}% stocks. Adding bonds can reduce volatility.`,
      reasoning: 'Balanced portfolios historically show better risk-adjusted returns and lower drawdowns during market corrections.',
      confidence: 82,
      actionable: true,
      actions: ['Research treasury bonds', 'Consider bond ETFs', 'Aim for 20-30% bond allocation'],
      createdAt: new Date().toISOString(),
    });
  }

  if (portfolio.holdings.length < 5) {
    insights.push({
      id: `insight-${Date.now()}-4`,
      type: 'warning',
      priority: 'high',
      title: 'Insufficient Diversification',
      description: `You have only ${portfolio.holdings.length} position${portfolio.holdings.length === 1 ? '' : 's'}. Consider diversifying across 8-12 holdings.`,
      reasoning: 'Concentrated portfolios carry higher unsystematic risk. Diversification helps protect against individual asset failures.',
      confidence: 90,
      actionable: true,
      actions: ['Add holdings in different sectors', 'Consider index ETFs', 'Research international exposure'],
      createdAt: new Date().toISOString(),
    });
  }

  const topHoldings = [...portfolio.holdings]
    .sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0))
    .slice(0, 1);
  
  if (topHoldings.length > 0) {
    const topPercentage = ((topHoldings[0].currentValue || 0) / portfolio.totalValue) * 100;
    if (topPercentage > 25) {
      insights.push({
        id: `insight-${Date.now()}-5`,
        type: 'warning',
        priority: 'high',
        title: 'High Concentration Risk',
        description: `${topHoldings[0].symbol} represents ${topPercentage.toFixed(1)}% of your portfolio.`,
        reasoning: 'Single position exceeding 25% creates significant downside risk if that asset underperforms.',
        confidence: 88,
        actionable: true,
        actions: [`Consider trimming ${topHoldings[0].symbol} position`, 'Reinvest proceeds across other holdings', 'Set position size limits'],
        relatedSymbols: [topHoldings[0].symbol],
        createdAt: new Date().toISOString(),
      });
    }
  }

  return insights;
};

export const generateOptimizationSuggestions = (
  portfolio: Portfolio,
  riskProfile: RiskProfile
): OptimizationSuggestion[] => {
  const suggestions: OptimizationSuggestion[] = [];
  
  const targetAllocations: Record<RiskProfile, { stock: number; etf: number; bond: number }> = {
    conservative: { stock: 30, etf: 20, bond: 50 },
    moderate: { stock: 50, etf: 30, bond: 20 },
    aggressive: { stock: 70, etf: 25, bond: 5 },
  };

  const targets = targetAllocations[riskProfile];
  const currentAllocation = new Map<string, number>();
  
  portfolio.holdings.forEach(h => {
    const current = currentAllocation.get(h.type) || 0;
    currentAllocation.set(h.type, current + ((h.currentValue || 0) / portfolio.totalValue) * 100);
  });

  const stockAllocation = currentAllocation.get('stock') || 0;
  const bondAllocation = currentAllocation.get('bond') || 0;

  if (Math.abs(stockAllocation - targets.stock) > 10) {
    suggestions.push({
      action: stockAllocation > targets.stock ? 'sell' : 'buy',
      symbol: 'STOCKS',
      currentAllocation: stockAllocation,
      targetAllocation: targets.stock,
      reason: `Your stock allocation is ${stockAllocation > targets.stock ? 'above' : 'below'} target for ${riskProfile} profile`,
      expectedImpact: {
        risk: stockAllocation > targets.stock ? -5 : 3,
        return: stockAllocation > targets.stock ? -2 : 4,
      },
    });
  }

  if (Math.abs(bondAllocation - targets.bond) > 10) {
    suggestions.push({
      action: bondAllocation > targets.bond ? 'sell' : 'buy',
      symbol: 'BONDS',
      currentAllocation: bondAllocation,
      targetAllocation: targets.bond,
      reason: `Your bond allocation is ${bondAllocation > targets.bond ? 'above' : 'below'} target for ${riskProfile} profile`,
      expectedImpact: {
        risk: bondAllocation > targets.bond ? 2 : -3,
        return: bondAllocation > targets.bond ? 1 : -1,
      },
    });
  }

  return suggestions;
};

export const analyzeSentiment = (text: string): 'positive' | 'neutral' | 'negative' => {
  const positiveWords = ['gain', 'rally', 'surge', 'exceed', 'growth', 'strong', 'beat', 'optimism', 'record'];
  const negativeWords = ['fall', 'drop', 'concern', 'scrutiny', 'volatility', 'loss', 'weak', 'decline'];
  
  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};
