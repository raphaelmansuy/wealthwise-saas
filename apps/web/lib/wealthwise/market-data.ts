import { Stock, NewsArticle, MarketIndex, Fund, FundCategory } from './types';

const generateRandomChange = (base: number, volatility: number = 0.03) => {
  const change = (Math.random() - 0.5) * 2 * base * volatility;
  return change;
};

export const generateMarketIndices = (): MarketIndex[] => {
  const indices = [
    { symbol: 'SPX', name: 'S&P 500', base: 5800 },
    { symbol: 'DJI', name: 'Dow Jones', base: 42800 },
    { symbol: 'IXIC', name: 'NASDAQ', base: 18400 },
    { symbol: 'RUT', name: 'Russell 2000', base: 2280 },
  ];

  return indices.map(index => {
    const change = generateRandomChange(index.base, 0.015);
    const value = index.base + change;
    const changePercent = (change / index.base) * 100;
    
    return {
      symbol: index.symbol,
      name: index.name,
      value: parseFloat(value.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
    };
  });
};

export const generateStockData = (symbol: string, name: string, basePrice: number): Stock => {
  const change = generateRandomChange(basePrice, 0.05);
  const price = basePrice + change;
  const changePercent = (change / basePrice) * 100;
  const previousClose = basePrice;
  const open = basePrice + generateRandomChange(basePrice, 0.01);
  const high = Math.max(price, open) + Math.random() * basePrice * 0.02;
  const low = Math.min(price, open) - Math.random() * basePrice * 0.02;
  const volume = Math.floor(Math.random() * 50000000) + 5000000;
  const marketCap = price * (Math.random() * 5000000000 + 100000000);

  return {
    symbol,
    name,
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    volume,
    marketCap,
    high: parseFloat(high.toFixed(2)),
    low: parseFloat(low.toFixed(2)),
    open: parseFloat(open.toFixed(2)),
    previousClose: parseFloat(previousClose.toFixed(2)),
    lastUpdated: new Date().toISOString(),
  };
};

export const popularStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 185.50 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', basePrice: 425.30 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', basePrice: 142.80 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 178.25 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', basePrice: 875.40 },
  { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 248.50 },
  { symbol: 'META', name: 'Meta Platforms Inc.', basePrice: 485.20 },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway', basePrice: 445.80 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', basePrice: 225.60 },
  { symbol: 'V', name: 'Visa Inc.', basePrice: 295.40 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', basePrice: 158.90 },
  { symbol: 'WMT', name: 'Walmart Inc.', basePrice: 89.75 },
];

export const generateStocks = (): Stock[] => {
  return popularStocks.map(stock => 
    generateStockData(stock.symbol, stock.name, stock.basePrice)
  );
};

export const generateNews = (): NewsArticle[] => {
  const newsItems = [
    {
      headline: 'Tech Stocks Rally on Strong Earnings Reports',
      source: 'Financial Times',
      summary: 'Major technology companies exceed analyst expectations, driving market optimism and investor confidence.',
      relatedSymbols: ['AAPL', 'MSFT', 'GOOGL'],
    },
    {
      headline: 'Federal Reserve Signals Potential Rate Changes',
      source: 'Reuters',
      summary: 'Central bank officials hint at monetary policy adjustments in response to evolving economic indicators.',
      relatedSymbols: ['SPX', 'DJI'],
    },
    {
      headline: 'NVIDIA Announces Next-Generation AI Chip',
      source: 'Bloomberg',
      summary: 'Graphics processor manufacturer unveils groundbreaking technology expected to accelerate artificial intelligence applications.',
      relatedSymbols: ['NVDA'],
    },
    {
      headline: 'Electric Vehicle Sales Surge in Global Markets',
      source: 'Wall Street Journal',
      summary: 'Automotive industry reports record adoption rates for electric vehicles across key international markets.',
      relatedSymbols: ['TSLA'],
    },
    {
      headline: 'Healthcare Sector Shows Resilience Amid Volatility',
      source: 'CNBC',
      summary: 'Pharmaceutical and medical device companies maintain stable performance despite broader market fluctuations.',
      relatedSymbols: ['JNJ'],
    },
    {
      headline: 'E-Commerce Giant Reports Record Holiday Sales',
      source: 'MarketWatch',
      summary: 'Online retail leader announces unprecedented shopping season results, beating analyst forecasts.',
      relatedSymbols: ['AMZN', 'WMT'],
    },
    {
      headline: 'Banking Sector Prepares for Regulatory Updates',
      source: 'Financial Times',
      summary: 'Major financial institutions adjust strategies in anticipation of new compliance requirements.',
      relatedSymbols: ['JPM'],
    },
    {
      headline: 'Social Media Platforms Face Increased Scrutiny',
      source: 'Reuters',
      summary: 'Technology companies address concerns about content moderation and user privacy protections.',
      relatedSymbols: ['META'],
    },
    {
      headline: 'Payment Networks Expand Global Infrastructure',
      source: 'Bloomberg',
      summary: 'Credit card companies invest in emerging markets and digital payment technologies.',
      relatedSymbols: ['V'],
    },
    {
      headline: 'Market Volatility Creates Trading Opportunities',
      source: 'Wall Street Journal',
      summary: 'Investment professionals identify potential value plays amid fluctuating equity valuations.',
      relatedSymbols: ['BRK.B'],
    },
  ];

  return newsItems.map((item, index) => ({
    id: `news-${index}`,
    headline: item.headline,
    source: item.source,
    url: '#',
    summary: item.summary,
    publishedAt: new Date(Date.now() - Math.random() * 3600000 * 12).toISOString(),
    relatedSymbols: item.relatedSymbols,
  }));
};

export const searchStocks = (query: string): Stock[] => {
  const allStocks = generateStocks();
  const searchTerm = query.toLowerCase();
  
  return allStocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchTerm) || 
    stock.name.toLowerCase().includes(searchTerm)
  );
};

export const getStockBySymbol = (symbol: string): Stock | null => {
  const stockConfig = popularStocks.find(s => s.symbol === symbol);
  if (!stockConfig) return null;
  
  return generateStockData(stockConfig.symbol, stockConfig.name, stockConfig.basePrice);
};

export const formatMarketCap = (marketCap: number): string => {
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`;
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`;
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`;
  }
  return `$${marketCap.toFixed(0)}`;
};

export const formatVolume = (volume: number): string => {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(2)}B`;
  } else if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M`;
  } else if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K`;
  }
  return volume.toString();
};

export const isMarketOpen = (): boolean => {
  const now = new Date();
  const day = now.getUTCDay();
  const hours = now.getUTCHours();
  
  if (day === 0 || day === 6) return false;
  
  const marketOpenUTC = 14.5;
  const marketCloseUTC = 21;
  
  return hours >= marketOpenUTC && hours < marketCloseUTC;
};

export const popularFunds = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'etf' as const, category: 'index' as FundCategory, basePrice: 485.50, expenseRatio: 0.09, totalAssets: 420000000000 },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf' as const, category: 'index' as FundCategory, basePrice: 445.80, expenseRatio: 0.03, totalAssets: 380000000000 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'etf' as const, category: 'sector' as FundCategory, basePrice: 420.30, expenseRatio: 0.20, totalAssets: 245000000000 },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'etf' as const, category: 'index' as FundCategory, basePrice: 258.90, expenseRatio: 0.03, totalAssets: 360000000000 },
  { symbol: 'AGG', name: 'iShares Core U.S. Aggregate Bond ETF', type: 'etf' as const, category: 'fixed-income' as FundCategory, basePrice: 98.25, expenseRatio: 0.03, totalAssets: 105000000000 },
  { symbol: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', type: 'etf' as const, category: 'international' as FundCategory, basePrice: 51.75, expenseRatio: 0.05, totalAssets: 115000000000 },
  { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', type: 'etf' as const, category: 'fixed-income' as FundCategory, basePrice: 72.40, expenseRatio: 0.03, totalAssets: 95000000000 },
  { symbol: 'VXUS', name: 'Vanguard Total International Stock ETF', type: 'etf' as const, category: 'international' as FundCategory, basePrice: 62.35, expenseRatio: 0.08, totalAssets: 72000000000 },
  { symbol: 'GLD', name: 'SPDR Gold Shares', type: 'etf' as const, category: 'sector' as FundCategory, basePrice: 198.40, expenseRatio: 0.40, totalAssets: 62000000000 },
  { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', type: 'etf' as const, category: 'sector' as FundCategory, basePrice: 89.60, expenseRatio: 0.12, totalAssets: 38000000000 },
  { symbol: 'VFIAX', name: 'Vanguard 500 Index Fund Admiral', type: 'mutual-fund' as const, category: 'index' as FundCategory, basePrice: 428.75, expenseRatio: 0.04, totalAssets: 520000000000 },
  { symbol: 'FXAIX', name: 'Fidelity 500 Index Fund', type: 'mutual-fund' as const, category: 'index' as FundCategory, basePrice: 175.25, expenseRatio: 0.015, totalAssets: 485000000000 },
  { symbol: 'VTSAX', name: 'Vanguard Total Stock Market Index Fund', type: 'mutual-fund' as const, category: 'index' as FundCategory, basePrice: 118.90, expenseRatio: 0.04, totalAssets: 365000000000 },
  { symbol: 'VBTLX', name: 'Vanguard Total Bond Market Index Fund', type: 'mutual-fund' as const, category: 'fixed-income' as FundCategory, basePrice: 10.45, expenseRatio: 0.05, totalAssets: 125000000000 },
  { symbol: 'VTMFX', name: 'Vanguard Tax-Managed Balanced Fund', type: 'mutual-fund' as const, category: 'balanced' as FundCategory, basePrice: 35.80, expenseRatio: 0.09, totalAssets: 18000000000 },
];

export const generateFundData = (
  symbol: string, 
  name: string, 
  type: 'etf' | 'mutual-fund',
  category: FundCategory,
  basePrice: number,
  expenseRatio: number,
  totalAssets: number
): Fund => {
  const change = generateRandomChange(basePrice, 0.02);
  const price = basePrice + change;
  const changePercent = (change / basePrice) * 100;
  
  const ytdReturn = (Math.random() * 30 - 5);
  const oneYearReturn = (Math.random() * 35 - 5);
  const threeYearReturn = (Math.random() * 15 + 5);
  const fiveYearReturn = (Math.random() * 12 + 6);
  
  const beta = category === 'fixed-income' 
    ? 0.1 + Math.random() * 0.3 
    : category === 'balanced'
    ? 0.5 + Math.random() * 0.4
    : 0.8 + Math.random() * 0.6;
  
  const sharpeRatio = Math.random() * 2 + 0.5;
  
  const dividendYield = category === 'fixed-income'
    ? Math.random() * 3 + 2
    : category === 'equity' || category === 'index'
    ? Math.random() * 2.5 + 0.5
    : Math.random() * 2 + 1;
  
  const morningstarRating = Math.floor(Math.random() * 3) + 3;
  
  const inceptionYear = 2000 + Math.floor(Math.random() * 20);
  
  const minimumInvestment = type === 'etf' 
    ? 0 
    : [0, 1000, 3000, 10000][Math.floor(Math.random() * 4)];
  
  const holdings = category === 'sector'
    ? Math.floor(Math.random() * 100) + 20
    : category === 'index'
    ? Math.floor(Math.random() * 3000) + 500
    : Math.floor(Math.random() * 500) + 50;
  
  const turnoverRate = category === 'index'
    ? Math.random() * 10 + 2
    : category === 'sector'
    ? Math.random() * 50 + 20
    : Math.random() * 30 + 10;

  return {
    symbol,
    name,
    type,
    category,
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    nav: parseFloat(price.toFixed(2)),
    totalAssets,
    expenseRatio,
    ytdReturn: parseFloat(ytdReturn.toFixed(2)),
    oneYearReturn: parseFloat(oneYearReturn.toFixed(2)),
    threeYearReturn: parseFloat(threeYearReturn.toFixed(2)),
    fiveYearReturn: parseFloat(fiveYearReturn.toFixed(2)),
    beta: parseFloat(beta.toFixed(2)),
    sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
    dividendYield: parseFloat(dividendYield.toFixed(2)),
    morningstarRating,
    inceptionDate: `${inceptionYear}-01-01`,
    minimumInvestment,
    holdings,
    turnoverRate: parseFloat(turnoverRate.toFixed(1)),
    lastUpdated: new Date().toISOString(),
  };
};

export const generateFunds = (): Fund[] => {
  return popularFunds.map(fund => 
    generateFundData(
      fund.symbol, 
      fund.name, 
      fund.type, 
      fund.category, 
      fund.basePrice, 
      fund.expenseRatio,
      fund.totalAssets
    )
  );
};

export const searchFunds = (query: string): Fund[] => {
  const allFunds = generateFunds();
  const searchTerm = query.toLowerCase();
  
  return allFunds.filter(fund => 
    fund.symbol.toLowerCase().includes(searchTerm) || 
    fund.name.toLowerCase().includes(searchTerm)
  );
};

export const getFundBySymbol = (symbol: string): Fund | null => {
  const fundConfig = popularFunds.find(f => f.symbol === symbol);
  if (!fundConfig) return null;
  
  return generateFundData(
    fundConfig.symbol, 
    fundConfig.name, 
    fundConfig.type, 
    fundConfig.category, 
    fundConfig.basePrice, 
    fundConfig.expenseRatio,
    fundConfig.totalAssets
  );
};

export const formatAssets = (assets: number): string => {
  if (assets >= 1e12) {
    return `$${(assets / 1e12).toFixed(2)}T`;
  } else if (assets >= 1e9) {
    return `$${(assets / 1e9).toFixed(2)}B`;
  } else if (assets >= 1e6) {
    return `$${(assets / 1e6).toFixed(2)}M`;
  }
  return `$${assets.toFixed(0)}`;
};

export const getCategoryLabel = (category: FundCategory): string => {
  const labels: Record<FundCategory, string> = {
    'equity': 'Equity',
    'fixed-income': 'Fixed Income',
    'balanced': 'Balanced',
    'index': 'Index',
    'sector': 'Sector',
    'international': 'International',
    'money-market': 'Money Market',
  };
  return labels[category];
};
