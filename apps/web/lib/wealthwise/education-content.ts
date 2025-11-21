export interface EducationModule {
  id: string;
  title: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  description: string;
  content: {
    overview: string;
    keyPoints: string[];
    examples?: string[];
    actionableSteps?: string[];
  };
  relatedTopics: string[];
}

export const educationCategories = [
  { id: 'basics', name: 'Investment Basics', icon: 'GraduationCap' },
  { id: 'assets', name: 'Asset Classes', icon: 'ChartLine' },
  { id: 'strategy', name: 'Investment Strategies', icon: 'Target' },
  { id: 'risk', name: 'Risk Management', icon: 'Shield' },
  { id: 'advanced', name: 'Advanced Techniques', icon: 'Lightning' },
  { id: 'tax', name: 'Tax & Legal', icon: 'Receipt' },
];

export const educationModules: EducationModule[] = [
  {
    id: 'stocks-fundamentals',
    title: 'Understanding Stocks',
    category: 'assets',
    level: 'beginner',
    duration: '8 min read',
    description: 'Learn what stocks are, how they work, and why companies issue them.',
    content: {
      overview: 'Stocks represent ownership shares in a company. When you buy stock, you become a partial owner and can benefit from the company\'s growth through price appreciation and dividends.',
      keyPoints: [
        'Stocks represent equity ownership in publicly traded companies',
        'Two ways to profit: capital gains (price increases) and dividends (profit distributions)',
        'Common stock gives voting rights; preferred stock offers fixed dividends',
        'Stock prices fluctuate based on company performance, market sentiment, and economic conditions',
        'Higher potential returns come with higher risk compared to bonds',
        'Long-term historical returns average 10% annually (S&P 500)',
      ],
      examples: [
        'Buying 100 shares of Apple at $150 = $15,000 investment',
        'If price rises to $180, your gain = $3,000 (20% return)',
        'Plus any dividends received during holding period',
      ],
      actionableSteps: [
        'Start with index funds before individual stocks',
        'Research company fundamentals: revenue, profit margins, growth',
        'Diversify across 15-20+ stocks to reduce single-company risk',
        'Hold quality stocks long-term (5+ years) to compound returns',
        'Reinvest dividends to accelerate wealth building',
      ],
    },
    relatedTopics: ['bonds-fundamentals', 'portfolio-diversification', 'valuation-metrics'],
  },
  {
    id: 'bonds-fundamentals',
    title: 'Understanding Bonds',
    category: 'assets',
    level: 'beginner',
    duration: '7 min read',
    description: 'Master fixed-income securities and how bonds provide stable income streams.',
    content: {
      overview: 'Bonds are loans you make to governments or corporations. In return, they pay you regular interest (coupon payments) and return your principal at maturity. Bonds offer predictable income with lower risk than stocks.',
      keyPoints: [
        'Bonds are debt instruments with fixed maturity dates and interest rates',
        'Three main types: Government (Treasury), Municipal, and Corporate bonds',
        'Bond prices move inversely to interest rates',
        'Credit ratings (AAA to D) indicate default risk',
        'Longer maturity bonds are more sensitive to rate changes',
        'Bonds provide portfolio stability during stock market downturns',
      ],
      examples: [
        '$10,000 bond with 5% coupon = $500 annual interest',
        'If rates rise to 6%, your bond price drops (now less attractive)',
        '10-year Treasury currently yields ~4.5%',
      ],
      actionableSteps: [
        'Match bond maturity to your timeline (short-term = less rate risk)',
        'Build a bond ladder: stagger maturities to manage rate risk',
        'Consider bond funds for diversification and professional management',
        'Allocate more to bonds as you near retirement (reduce volatility)',
        'Compare yields after taxes (municipal bonds may be tax-free)',
      ],
    },
    relatedTopics: ['interest-rate-risk', 'bond-laddering', 'asset-allocation'],
  },
  {
    id: 'etf-fundamentals',
    title: 'ETFs & Index Funds',
    category: 'assets',
    level: 'beginner',
    duration: '9 min read',
    description: 'Discover how ETFs provide instant diversification and low-cost market exposure.',
    content: {
      overview: 'Exchange-Traded Funds (ETFs) are investment funds that trade like stocks but hold diversified portfolios. They offer instant diversification, low fees, and tax efficiency—ideal for most investors.',
      keyPoints: [
        'ETFs hold baskets of stocks/bonds tracking indexes or themes',
        'Trade throughout the day like stocks (vs. mutual funds at day-end)',
        'Ultra-low expense ratios: 0.03%-0.20% vs. 1%+ for active funds',
        'Index ETFs passively track markets (S&P 500, Total Market)',
        'Sector ETFs target industries (tech, healthcare, energy)',
        'Tax-efficient structure minimizes capital gains distributions',
      ],
      examples: [
        'VOO (Vanguard S&P 500): 0.03% fee, instant 500-stock diversification',
        'AGG (Bond Aggregate): Total U.S. bond market exposure',
        '$10,000 in VOO = owning pieces of Apple, Microsoft, Amazon, etc.',
      ],
      actionableSteps: [
        'Start with total market ETFs (VTI) for broadest diversification',
        'Add international exposure (VXUS) for global diversification',
        'Keep expense ratios under 0.20%—fees compound against you',
        'Use sector ETFs sparingly (15% max) to avoid over-concentration',
        'Rebalance annually to maintain target allocations',
      ],
    },
    relatedTopics: ['portfolio-diversification', 'expense-ratios', 'passive-vs-active'],
  },
  {
    id: 'portfolio-diversification',
    title: 'Portfolio Diversification',
    category: 'strategy',
    level: 'beginner',
    duration: '10 min read',
    description: 'Learn the most important principle in investing: never put all eggs in one basket.',
    content: {
      overview: 'Diversification spreads your investments across different assets, sectors, and geographies to reduce risk. It\'s the only "free lunch" in investing—lowering volatility without sacrificing long-term returns.',
      keyPoints: [
        'Diversification reduces portfolio volatility and single-investment risk',
        'Spread across asset classes (stocks, bonds, real estate, commodities)',
        'Diversify within stocks: by sector, company size, geography',
        'Correlation matters: choose assets that don\'t move together',
        'Over-diversification exists: 20-30 stocks captures most benefits',
        'Rebalancing forces "buy low, sell high" discipline',
      ],
      examples: [
        'Simple 3-fund portfolio: 60% U.S. stocks, 30% international, 10% bonds',
        'If tech crashes 30%, your healthcare/consumer holdings cushion the blow',
        'Annual rebalancing: sell winners, buy underperformers',
      ],
      actionableSteps: [
        'Use the "120 minus age" rule for stock allocation (age 30 = 90% stocks)',
        'Hold at least 3 asset classes and 6+ sectors',
        'Add international stocks (20-40% of equity allocation)',
        'Include bonds for stability (increase allocation with age)',
        'Rebalance when allocations drift 5%+ from targets',
      ],
    },
    relatedTopics: ['asset-allocation', 'rebalancing-strategies', 'correlation'],
  },
  {
    id: 'risk-management',
    title: 'Risk Management Essentials',
    category: 'risk',
    level: 'intermediate',
    duration: '11 min read',
    description: 'Master the tools and metrics to understand and control investment risk.',
    content: {
      overview: 'Risk management isn\'t about avoiding risk—it\'s about understanding and controlling it. Learn to measure volatility, diversify effectively, and position-size appropriately to achieve your goals without panic-selling.',
      keyPoints: [
        'Volatility (standard deviation) measures price fluctuation magnitude',
        'Beta shows how much your portfolio moves relative to the market',
        'Sharpe ratio compares returns to risk taken (higher is better)',
        'Maximum drawdown reveals worst historical loss periods',
        'Time horizon is your greatest risk management tool',
        'Position sizing prevents single investments from sinking portfolios',
      ],
      examples: [
        'Stock A: 15% return, 20% volatility vs. Stock B: 12% return, 10% volatility',
        'Sharpe ratio: Stock A = 0.75, Stock B = 1.2 (B is better risk-adjusted)',
        'Portfolio with 30% max drawdown needs emotional resilience',
      ],
      actionableSteps: [
        'Calculate your risk tolerance: how much volatility can you stomach?',
        'Never put more than 5% in a single stock (10% max for high conviction)',
        'Use stop-losses on individual positions (15-20% below entry)',
        'Stress-test your portfolio: what happens in a 40% market crash?',
        'Keep 3-6 months emergency cash outside investments',
      ],
    },
    relatedTopics: ['volatility-metrics', 'position-sizing', 'emotional-investing'],
  },
  {
    id: 'asset-allocation',
    title: 'Strategic Asset Allocation',
    category: 'strategy',
    level: 'intermediate',
    duration: '12 min read',
    description: 'Design your portfolio mix to match your goals, timeline, and risk tolerance.',
    content: {
      overview: 'Asset allocation—how you divide investments among stocks, bonds, and other assets—determines 90%+ of portfolio performance. Your allocation should reflect your age, goals, risk tolerance, and time horizon.',
      keyPoints: [
        'Asset allocation matters far more than individual security selection',
        'Stocks offer growth; bonds provide stability and income',
        'Younger investors can handle higher stock allocations (longer recovery time)',
        'Conservative: 40/60 stocks/bonds; Moderate: 60/40; Aggressive: 80/20',
        'Include alternative assets (REITs, commodities) for further diversification',
        'Review and adjust allocation annually or after major life changes',
      ],
      examples: [
        'Age 25: 90% stocks, 10% bonds (aggressive growth)',
        'Age 50: 60% stocks, 40% bonds (balanced approach)',
        'Age 70: 30% stocks, 70% bonds (capital preservation)',
      ],
      actionableSteps: [
        'Define your investment timeline (retirement, home purchase, etc.)',
        'Assess risk tolerance: take a questionnaire or work with an advisor',
        'Choose target allocation based on age and goals',
        'Implement with low-cost index funds or target-date funds',
        'Rebalance when allocations drift 5%+ from targets',
      ],
    },
    relatedTopics: ['portfolio-diversification', 'rebalancing-strategies', 'lifecycle-investing'],
  },
  {
    id: 'valuation-metrics',
    title: 'Stock Valuation Metrics',
    category: 'advanced',
    level: 'intermediate',
    duration: '13 min read',
    description: 'Learn to analyze whether stocks are fairly priced using fundamental metrics.',
    content: {
      overview: 'Valuation metrics help determine if a stock is cheap, fairly valued, or overpriced. While no single metric tells the whole story, combining several provides insight into investment quality and potential returns.',
      keyPoints: [
        'P/E Ratio (Price/Earnings): how much you pay per dollar of profit',
        'P/B Ratio (Price/Book): stock price vs. company\'s net asset value',
        'Dividend Yield: annual dividend as percentage of stock price',
        'PEG Ratio: P/E adjusted for growth rate (under 1 = potentially undervalued)',
        'Free Cash Flow: actual cash company generates (more reliable than earnings)',
        'Compare metrics to industry peers and historical averages',
      ],
      examples: [
        'Stock at $100 with $5 EPS = P/E of 20 (paying $20 per $1 of earnings)',
        'S&P 500 average P/E: ~16-18 (above = expensive, below = cheap)',
        'High dividend yield (5%+) may signal distress or value opportunity',
      ],
      actionableSteps: [
        'Screen for stocks with P/E below 15 and PEG under 1.5',
        'Prioritize companies with growing free cash flow',
        'Compare valuations to 5-year historical ranges',
        'Avoid "value traps": cheap stocks that keep getting cheaper',
        'Combine quantitative metrics with qualitative analysis (moat, management)',
      ],
    },
    relatedTopics: ['fundamental-analysis', 'value-investing', 'growth-investing'],
  },
  {
    id: 'tax-loss-harvesting',
    title: 'Tax-Loss Harvesting',
    category: 'tax',
    level: 'advanced',
    duration: '10 min read',
    description: 'Legally reduce your tax bill by strategically realizing investment losses.',
    content: {
      overview: 'Tax-loss harvesting involves selling losing investments to offset capital gains and reduce taxable income by up to $3,000 annually. This powerful strategy can save thousands in taxes over time.',
      keyPoints: [
        'Sell losing positions to offset capital gains from winners',
        'Can deduct up to $3,000 in net losses against ordinary income annually',
        'Excess losses carry forward to future years indefinitely',
        'Wash-sale rule: can\'t buy "substantially identical" security within 30 days',
        'Replace sold position with similar (but not identical) investment',
        'Most effective in taxable accounts (not IRAs or 401(k)s)',
      ],
      examples: [
        'Sell Stock A for $5,000 loss, offset $5,000 gain from Stock B',
        'Result: $0 capital gains taxes owed (could save $750-$1,000)',
        'Replace Stock A with similar sector ETF to maintain exposure',
      ],
      actionableSteps: [
        'Review portfolio quarterly for loss-harvesting opportunities',
        'Target losses of 10%+ for meaningful tax benefit',
        'Avoid wash sales: wait 31 days or buy different security',
        'Harvest losses in high-income years for maximum benefit',
        'Track cost basis carefully to avoid IRS issues',
      ],
    },
    relatedTopics: ['tax-optimization', 'cost-basis-tracking', 'wash-sale-rule'],
  },
  {
    id: 'dollar-cost-averaging',
    title: 'Dollar-Cost Averaging',
    category: 'strategy',
    level: 'beginner',
    duration: '8 min read',
    description: 'Invest consistently over time to reduce timing risk and build wealth steadily.',
    content: {
      overview: 'Dollar-cost averaging (DCA) means investing a fixed amount regularly regardless of market conditions. This removes emotion, reduces timing risk, and automatically buys more shares when prices are low.',
      keyPoints: [
        'Invest fixed amounts on a regular schedule (weekly, monthly)',
        'Buy more shares when prices are low, fewer when high',
        'Removes emotional decision-making and market timing pressure',
        'Particularly effective in volatile markets',
        'Studies show DCA often underperforms lump-sum investing (but reduces regret)',
        'Best for investors receiving regular income (paycheck investing)',
      ],
      examples: [
        'Invest $500/month for 12 months = $6,000 total',
        'Month 1: $500 buys 10 shares at $50. Month 6: $500 buys 16.7 shares at $30',
        'Average cost per share is lower than average price over period',
      ],
      actionableSteps: [
        'Set up automatic monthly investments from your paycheck',
        'Invest same amount regardless of headlines or market swings',
        'Increase contribution amounts annually with raises',
        'Combine DCA with annual rebalancing for optimal strategy',
        'Continue through market downturns—that\'s when DCA shines most',
      ],
    },
    relatedTopics: ['market-timing', 'emotional-investing', 'systematic-investing'],
  },
  {
    id: 'compound-interest',
    title: 'The Power of Compounding',
    category: 'basics',
    level: 'beginner',
    duration: '7 min read',
    description: 'Understand how compound returns create exponential wealth growth over time.',
    content: {
      overview: 'Compound interest is "interest on interest"—your returns generate their own returns. This exponential growth is the most powerful force in wealth building, especially when started early.',
      keyPoints: [
        'Earnings generate their own earnings in a snowball effect',
        'Time is more important than timing—start early, invest consistently',
        'Rule of 72: divide 72 by return rate = years to double money',
        'At 10% returns, money doubles every 7.2 years',
        'Reinvesting dividends dramatically accelerates compounding',
        'Even small amounts grow large over decades',
      ],
      examples: [
        '$10,000 at 8% for 30 years = $100,626 (10x return)',
        'Invest $500/month from age 25-65 at 10% = $3.16 million',
        'Wait until 35 to start: only $1.13 million (10 years = $2M difference)',
      ],
      actionableSteps: [
        'Start investing NOW—every year matters exponentially',
        'Reinvest all dividends and capital gains',
        'Maximize tax-advantaged accounts (401k, IRA) for turbo-compounding',
        'Avoid withdrawals—breaking compounding is extremely costly',
        'Calculate your "freedom number" and time horizon',
      ],
    },
    relatedTopics: ['time-value-money', 'retirement-planning', 'reinvesting-dividends'],
  },
  {
    id: 'retirement-accounts',
    title: 'Retirement Account Strategies',
    category: 'tax',
    level: 'intermediate',
    duration: '11 min read',
    description: 'Maximize tax-advantaged accounts to accelerate wealth building.',
    content: {
      overview: 'Retirement accounts like 401(k)s and IRAs offer powerful tax benefits that can add hundreds of thousands to your nest egg. Understanding contribution limits, tax treatment, and withdrawal rules is essential.',
      keyPoints: [
        '401(k): Pre-tax contributions, employer match, $23,000 limit (2024)',
        'Traditional IRA: Tax-deductible contributions, taxed at withdrawal',
        'Roth IRA: After-tax contributions, tax-free growth and withdrawals',
        'Always capture full employer 401(k) match (free money)',
        'Roth vs. Traditional: pay taxes now (Roth) or later (Traditional)',
        'Early withdrawal penalties (10%) before age 59.5 (with exceptions)',
      ],
      examples: [
        '6% 401(k) contribution with 50% match = 9% total (instant 50% return)',
        '$6,500 Roth IRA at age 25, growing to $175,000 tax-free by 65',
        'Tax savings: $19,500 contribution in 24% bracket = $4,680 saved',
      ],
      actionableSteps: [
        'Contribute enough to 401(k) to capture full employer match',
        'Max out Roth IRA if eligible ($7,000/year, $8,000 if 50+)',
        'Choose Roth if young/low tax bracket, Traditional if high earner',
        'Consider backdoor Roth if income exceeds direct Roth limits',
        'Increase contributions 1% annually until maxing out',
      ],
    },
    relatedTopics: ['tax-optimization', 'retirement-planning', 'roth-conversions'],
  },
  {
    id: 'rebalancing-strategies',
    title: 'Portfolio Rebalancing',
    category: 'strategy',
    level: 'intermediate',
    duration: '9 min read',
    description: 'Maintain your target allocation and enforce buy-low, sell-high discipline.',
    content: {
      overview: 'Rebalancing means periodically selling outperforming assets and buying underperformers to return to your target allocation. This enforces disciplined "buy low, sell high" behavior and controls risk.',
      keyPoints: [
        'Rebalancing prevents portfolio drift toward excessive risk',
        'Systematic selling of winners and buying of losers',
        'Annual or semi-annual rebalancing is usually sufficient',
        'Threshold-based: rebalance when allocations drift 5%+',
        'Use new contributions to rebalance (avoids selling)',
        'Consider tax implications in taxable accounts',
      ],
      examples: [
        'Target: 70% stocks, 30% bonds. After rally: 80/20',
        'Rebalance: sell 10% stocks, buy bonds to restore 70/30',
        'This forces taking profits from stocks at highs',
      ],
      actionableSteps: [
        'Set annual rebalancing date (e.g., January 1)',
        'Check allocations quarterly but only act if 5%+ drift',
        'In taxable accounts, use new money to rebalance first',
        'Combine with tax-loss harvesting for maximum efficiency',
        'Automate with target-date funds if you prefer hands-off approach',
      ],
    },
    relatedTopics: ['asset-allocation', 'portfolio-drift', 'tax-efficient-rebalancing'],
  },
];

export function getModulesByCategory(category: string): EducationModule[] {
  return educationModules.filter(m => m.category === category);
}

export function getModulesByLevel(level: string): EducationModule[] {
  return educationModules.filter(m => m.level === level);
}

export function getModuleById(id: string): EducationModule | undefined {
  return educationModules.find(m => m.id === id);
}

export function getRelatedModules(moduleId: string): EducationModule[] {
  const module = getModuleById(moduleId);
  if (!module) return [];
  
  return educationModules.filter(m => 
    module.relatedTopics.includes(m.id)
  ).slice(0, 3);
}
