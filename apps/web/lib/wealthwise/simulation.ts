import { Portfolio, SimulationScenario, SimulationResult } from './types';

export const predefinedScenarios: SimulationScenario[] = [
  {
    id: 'market-crash',
    name: 'Market Crash',
    type: 'market_crash',
    parameters: {
      marketDrop: 30,
      duration: 6,
    },
  },
  {
    id: 'recession',
    name: 'Economic Recession',
    type: 'recession',
    parameters: {
      marketDrop: 20,
      duration: 12,
    },
  },
  {
    id: 'inflation-spike',
    name: 'Inflation Spike',
    type: 'inflation',
    parameters: {
      inflationRate: 8,
      duration: 18,
    },
  },
  {
    id: 'rate-hike',
    name: 'Interest Rate Hike',
    type: 'interest_rate',
    parameters: {
      interestRate: 6,
      duration: 12,
    },
  },
];

export const runMonteCarloSimulation = (
  portfolio: Portfolio,
  years: number = 10,
  iterations: number = 1000
): { paths: number[][]; percentiles: { p25: number[]; p50: number[]; p75: number[] } } => {
  const annualReturn = 0.08;
  const annualVolatility = 0.16;
  const monthlyReturn = annualReturn / 12;
  const monthlyVolatility = annualVolatility / Math.sqrt(12);
  const months = years * 12;
  
  const paths: number[][] = [];
  
  const generateNormalRandom = (): number => {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  
  for (let i = 0; i < iterations; i++) {
    const path: number[] = [portfolio.totalValue];
    let value = portfolio.totalValue;
    
    for (let month = 1; month <= months; month++) {
      const randomShock = generateNormalRandom();
      const monthlyGrowth = monthlyReturn + monthlyVolatility * randomShock;
      value *= Math.exp(monthlyGrowth);
      path.push(value);
    }
    
    paths.push(path);
  }
  
  const percentiles = {
    p25: [] as number[],
    p50: [] as number[],
    p75: [] as number[],
  };
  
  for (let month = 0; month <= months; month++) {
    const values = paths.map(path => path[month]).sort((a, b) => a - b);
    percentiles.p25.push(values[Math.floor(iterations * 0.25)]);
    percentiles.p50.push(values[Math.floor(iterations * 0.50)]);
    percentiles.p75.push(values[Math.floor(iterations * 0.75)]);
  }
  
  return { paths, percentiles };
};

export const runScenarioSimulation = (
  portfolio: Portfolio,
  scenario: SimulationScenario
): SimulationResult => {
  const initialValue = portfolio.totalValue;
  let projectedValue = initialValue;
  
  switch (scenario.type) {
    case 'market_crash':
      projectedValue = initialValue * (1 - (scenario.parameters.marketDrop || 30) / 100);
      break;
    case 'recession':
      projectedValue = initialValue * (1 - (scenario.parameters.marketDrop || 20) / 100);
      break;
    case 'inflation':
      const inflationImpact = 1 - ((scenario.parameters.inflationRate || 8) / 100) * 0.5;
      projectedValue = initialValue * inflationImpact;
      break;
    case 'interest_rate':
      const bondPercentage = portfolio.holdings
        .filter(h => h.type === 'bond')
        .reduce((sum, h) => sum + ((h.currentValue || 0) / portfolio.totalValue), 0);
      const rateImpact = 1 - (bondPercentage * 0.15);
      projectedValue = initialValue * rateImpact;
      break;
    default:
      projectedValue = initialValue * 0.9;
  }
  
  const maxDrawdown = ((projectedValue - initialValue) / initialValue) * 100;
  const recoveryTime = Math.abs(maxDrawdown) / 2;
  
  const volatility = 0.15;
  const lower = projectedValue * (1 - volatility);
  const upper = projectedValue * (1 + volatility);
  
  return {
    scenario,
    initialValue,
    projectedValue,
    maxDrawdown: Math.abs(maxDrawdown),
    recoveryTime: Math.round(recoveryTime),
    confidenceInterval: {
      lower,
      median: projectedValue,
      upper,
    },
  };
};

export const runDetailedScenarioSimulation = (
  portfolio: Portfolio,
  scenario: SimulationScenario
): SimulationResult => {
  const initialValue = portfolio.totalValue;
  const duration = scenario.parameters.duration || 12;
  let projectedValue = initialValue;
  let worstValue = initialValue;
  
  const timeline: Array<{ month: number; value: number }> = [];
  timeline.push({ month: 0, value: initialValue });
  
  let currentValue = initialValue;
  const impactByAsset: Record<string, number> = {};
  
  switch (scenario.type) {
    case 'market_crash': {
      const marketDrop = scenario.parameters.marketDrop || 30;
      const crashMonths = Math.floor(duration * 0.3);
      const recoveryMonths = duration - crashMonths;
      
      for (let month = 1; month <= crashMonths; month++) {
        const dropProgress = month / crashMonths;
        currentValue = initialValue * (1 - (marketDrop / 100) * dropProgress);
        timeline.push({ month, value: currentValue });
        if (currentValue < worstValue) worstValue = currentValue;
      }
      
      portfolio.holdings.forEach(h => {
        const multiplier = h.type === 'stock' ? 1.2 : h.type === 'etf' ? 1.0 : 0.5;
        impactByAsset[h.type] = -marketDrop * multiplier;
      });
      
      for (let month = crashMonths + 1; month <= duration; month++) {
        const recoveryProgress = (month - crashMonths) / recoveryMonths;
        const recovery = (marketDrop / 100) * recoveryProgress * 0.6;
        currentValue = initialValue * (1 - (marketDrop / 100) + recovery);
        timeline.push({ month, value: currentValue });
      }
      
      projectedValue = currentValue;
      break;
    }
    case 'recession': {
      const marketDrop = scenario.parameters.marketDrop || 20;
      const recessionMonths = Math.floor(duration * 0.5);
      const recoveryMonths = duration - recessionMonths;
      
      for (let month = 1; month <= recessionMonths; month++) {
        const dropProgress = month / recessionMonths;
        currentValue = initialValue * (1 - (marketDrop / 100) * dropProgress * 0.9);
        timeline.push({ month, value: currentValue });
        if (currentValue < worstValue) worstValue = currentValue;
      }
      
      portfolio.holdings.forEach(h => {
        const multiplier = h.type === 'stock' ? 1.1 : h.type === 'etf' ? 0.9 : 0.3;
        impactByAsset[h.type] = -marketDrop * multiplier;
      });
      
      for (let month = recessionMonths + 1; month <= duration; month++) {
        const recoveryProgress = (month - recessionMonths) / recoveryMonths;
        const recovery = (marketDrop / 100) * recoveryProgress * 0.7;
        currentValue = initialValue * (1 - (marketDrop / 100) * 0.9 + recovery);
        timeline.push({ month, value: currentValue });
      }
      
      projectedValue = currentValue;
      break;
    }
    case 'inflation': {
      const inflationRate = scenario.parameters.inflationRate || 8;
      const monthlyInflation = inflationRate / 100 / 12;
      
      for (let month = 1; month <= duration; month++) {
        const realValueLoss = monthlyInflation * month;
        currentValue = initialValue * (1 - realValueLoss);
        timeline.push({ month, value: currentValue });
        if (currentValue < worstValue) worstValue = currentValue;
      }
      
      portfolio.holdings.forEach(h => {
        const multiplier = h.type === 'bond' ? 1.5 : h.type === 'stock' ? 0.4 : 0.7;
        impactByAsset[h.type] = -inflationRate * multiplier;
      });
      
      projectedValue = currentValue;
      break;
    }
    case 'interest_rate': {
      const rateIncrease = scenario.parameters.interestRate || 6;
      const bondPercentage = portfolio.holdings
        .filter(h => h.type === 'bond')
        .reduce((sum, h) => sum + ((h.currentValue || 0) / portfolio.totalValue), 0);
      
      const bondImpact = bondPercentage * (rateIncrease * 2.5);
      const stockImpact = (1 - bondPercentage) * (rateIncrease * 0.5);
      const totalImpact = bondImpact + stockImpact;
      
      for (let month = 1; month <= duration; month++) {
        const impactProgress = month / duration;
        currentValue = initialValue * (1 - (totalImpact / 100) * impactProgress);
        timeline.push({ month, value: currentValue });
        if (currentValue < worstValue) worstValue = currentValue;
      }
      
      portfolio.holdings.forEach(h => {
        const multiplier = h.type === 'bond' ? 2.5 : h.type === 'stock' ? 0.5 : 1.2;
        impactByAsset[h.type] = -rateIncrease * multiplier;
      });
      
      projectedValue = currentValue;
      break;
    }
    default:
      projectedValue = initialValue * 0.9;
      for (let month = 1; month <= duration; month++) {
        currentValue = initialValue * (1 - (0.1 * month / duration));
        timeline.push({ month, value: currentValue });
      }
  }
  
  const maxDrawdown = ((worstValue - initialValue) / initialValue) * 100;
  const recoveryTime = Math.abs(maxDrawdown) * 2;
  
  const volatility = 0.15;
  const lower = projectedValue * (1 - volatility);
  const upper = projectedValue * (1 + volatility);
  
  const recommendations = generateRecommendations(scenario, maxDrawdown, portfolio);
  
  return {
    scenario,
    initialValue,
    projectedValue,
    maxDrawdown: Math.abs(maxDrawdown),
    recoveryTime: Math.round(recoveryTime),
    confidenceInterval: {
      lower,
      median: projectedValue,
      upper,
    },
    timeline,
    assetImpact: impactByAsset,
    recommendations,
  };
};

const generateRecommendations = (
  scenario: SimulationScenario,
  maxDrawdown: number,
  portfolio: Portfolio
): string[] => {
  const recommendations: string[] = [];
  
  if (Math.abs(maxDrawdown) > 25) {
    recommendations.push('Consider increasing allocation to defensive assets like bonds or dividend-paying stocks to reduce volatility');
  }
  
  const stockPercentage = portfolio.holdings
    .filter(h => h.type === 'stock')
    .reduce((sum, h) => sum + ((h.currentValue || 0) / portfolio.totalValue), 0);
  
  const bondPercentage = portfolio.holdings
    .filter(h => h.type === 'bond')
    .reduce((sum, h) => sum + ((h.currentValue || 0) / portfolio.totalValue), 0);
  
  if (scenario.type === 'market_crash' || scenario.type === 'recession') {
    if (stockPercentage > 0.7) {
      recommendations.push('Your stock allocation is high - consider adding 10-20% bonds to cushion market downturns');
    }
    if (bondPercentage < 0.1) {
      recommendations.push('Add government bonds or treasury securities as a hedge against equity market crashes');
    }
    recommendations.push('Maintain an emergency fund of 6-12 months expenses in liquid assets outside this portfolio');
  }
  
  if (scenario.type === 'inflation') {
    if (bondPercentage > 0.3) {
      recommendations.push('High bond allocation is vulnerable to inflation - consider inflation-protected securities (TIPS)');
    }
    recommendations.push('Consider adding real assets like commodity ETFs or real estate investment trusts (REITs)');
  }
  
  if (scenario.type === 'interest_rate') {
    if (bondPercentage > 0.2) {
      recommendations.push('Reduce duration of bond holdings to minimize interest rate sensitivity');
    }
    recommendations.push('Consider dividend growth stocks that can benefit from rising rates');
  }
  
  if (portfolio.holdings.length < 5) {
    recommendations.push('Diversify across more holdings (aim for 10-15) to reduce concentration risk');
  }
  
  return recommendations;
};

export const calculateEfficientFrontier = (
  portfolio: Portfolio
): { risk: number; return: number }[] => {
  const points: { risk: number; return: number }[] = [];
  
  for (let risk = 5; risk <= 25; risk += 2) {
    const expectedReturn = 3 + (risk * 0.4) + (Math.random() - 0.5);
    points.push({ risk, return: expectedReturn });
  }
  
  return points.sort((a, b) => a.risk - b.risk);
};
