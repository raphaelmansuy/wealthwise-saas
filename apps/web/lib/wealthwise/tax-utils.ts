import { Portfolio, Holding, TaxOpportunity } from './types';

export const identifyTaxLossHarvestingOpportunities = (portfolio: Portfolio): TaxOpportunity[] => {
  const opportunities: TaxOpportunity[] = [];
  const taxRate = 0.15;
  
  portfolio.holdings.forEach(holding => {
    if ((holding.gainLoss || 0) < 0 && Math.abs(holding.gainLoss || 0) > 500) {
      const potentialSavings = Math.abs(holding.gainLoss || 0) * taxRate;
      
      opportunities.push({
        id: `tax-${holding.id}`,
        type: 'tax_loss_harvesting',
        holding,
        potentialSavings,
        description: `Selling ${holding.symbol} could generate $${Math.abs(holding.gainLoss || 0).toFixed(2)} in tax losses, saving approximately $${potentialSavings.toFixed(2)} in taxes.`,
        steps: [
          `Sell ${holding.quantity} shares of ${holding.symbol}`,
          'Wait 30 days to avoid wash sale rule',
          'Consider purchasing similar (but not identical) security',
          'Use loss to offset capital gains or up to $3,000 of ordinary income',
        ],
      });
    }
  });
  
  return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
};

export const calculateCapitalGains = (holding: Holding): { shortTerm: number; longTerm: number } => {
  const purchaseDate = new Date(holding.purchaseDate);
  const daysSincePurchase = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
  const gainLoss = holding.gainLoss || 0;
  
  if (daysSincePurchase > 365) {
    return { shortTerm: 0, longTerm: gainLoss };
  } else {
    return { shortTerm: gainLoss, longTerm: 0 };
  }
};

export const calculateTotalCapitalGains = (
  portfolio: Portfolio
): { shortTerm: number; longTerm: number; estimatedTax: number } => {
  let shortTerm = 0;
  let longTerm = 0;
  
  portfolio.holdings.forEach(holding => {
    const gains = calculateCapitalGains(holding);
    shortTerm += gains.shortTerm;
    longTerm += gains.longTerm;
  });
  
  const shortTermTaxRate = 0.24;
  const longTermTaxRate = 0.15;
  
  const estimatedTax = 
    Math.max(0, shortTerm) * shortTermTaxRate + 
    Math.max(0, longTerm) * longTermTaxRate;
  
  return { shortTerm, longTerm, estimatedTax };
};

export const calculateExpenseRatios = (portfolio: Portfolio): { total: number; annual: number; tenYear: number } => {
  const avgExpenseRatio = 0.0035;
  const annual = portfolio.totalValue * avgExpenseRatio;
  const tenYear = portfolio.totalValue * Math.pow(1.07, 10) * avgExpenseRatio * 10;
  
  return {
    total: avgExpenseRatio,
    annual,
    tenYear,
  };
};
