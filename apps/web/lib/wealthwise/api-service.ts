import { Stock, MarketIndex, Fund, FundCategory } from './types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class MarketDataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 60000;
  private readonly MARKET_HOURS_TTL = 15000;
  
  set<T>(key: string, data: T, ttl?: number): void {
    const timestamp = Date.now();
    const cacheTTL = ttl || (this.isMarketOpen() ? this.MARKET_HOURS_TTL : this.DEFAULT_TTL);
    this.cache.set(key, {
      data,
      timestamp,
      expiresAt: timestamp + cacheTTL,
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  private isMarketOpen(): boolean {
    const now = new Date();
    const day = now.getUTCDay();
    const hours = now.getUTCHours();
    
    if (day === 0 || day === 6) return false;
    
    const marketOpenUTC = 14.5;
    const marketCloseUTC = 21;
    
    return hours >= marketOpenUTC && hours < marketCloseUTC;
  }
}

const cache = new MarketDataCache();

interface YahooFinanceQuote {
  symbol: string;
  longName?: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  marketCap?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketOpen?: number;
  regularMarketPreviousClose?: number;
}

interface AlphaVantageGlobalQuote {
  '01. symbol': string;
  '02. open': string;
  '03. high': string;
  '04. low': string;
  '05. price': string;
  '06. volume': string;
  '07. latest trading day': string;
  '08. previous close': string;
  '09. change': string;
  '10. change percent': string;
}

interface PolygonSnapshot {
  ticker: string;
  day?: {
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    vw: number;
  };
  prevDay?: {
    c: number;
  };
  todaysChange?: number;
  todaysChangePerc?: number;
  updated?: number;
}

const FALLBACK_STOCKS = [
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

const FALLBACK_FUNDS = [
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

const FALLBACK_INDICES = [
  { symbol: 'SPX', name: 'S&P 500', baseValue: 5800 },
  { symbol: 'DJI', name: 'Dow Jones', baseValue: 42800 },
  { symbol: 'IXIC', name: 'NASDAQ', baseValue: 18400 },
  { symbol: 'RUT', name: 'Russell 2000', baseValue: 2280 },
];

const generateRandomChange = (base: number, volatility: number = 0.03) => {
  const change = (Math.random() - 0.5) * 2 * base * volatility;
  return change;
};

const generateFallbackStock = (config: typeof FALLBACK_STOCKS[0]): Stock => {
  const change = generateRandomChange(config.basePrice, 0.05);
  const price = config.basePrice + change;
  const changePercent = (change / config.basePrice) * 100;
  const previousClose = config.basePrice;
  const open = config.basePrice + generateRandomChange(config.basePrice, 0.01);
  const high = Math.max(price, open) + Math.random() * config.basePrice * 0.02;
  const low = Math.min(price, open) - Math.random() * config.basePrice * 0.02;
  const volume = Math.floor(Math.random() * 50000000) + 5000000;
  const marketCap = price * (Math.random() * 5000000000 + 100000000);

  return {
    symbol: config.symbol,
    name: config.name,
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

const generateFallbackFund = (config: typeof FALLBACK_FUNDS[0]): Fund => {
  const change = generateRandomChange(config.basePrice, 0.02);
  const price = config.basePrice + change;
  const changePercent = (change / config.basePrice) * 100;
  
  const ytdReturn = (Math.random() * 30 - 5);
  const oneYearReturn = (Math.random() * 35 - 5);
  const threeYearReturn = (Math.random() * 15 + 5);
  const fiveYearReturn = (Math.random() * 12 + 6);
  
  const beta = config.category === 'fixed-income' 
    ? 0.1 + Math.random() * 0.3 
    : config.category === 'balanced'
    ? 0.5 + Math.random() * 0.4
    : 0.8 + Math.random() * 0.6;
  
  const sharpeRatio = Math.random() * 2 + 0.5;
  
  const dividendYield = config.category === 'fixed-income'
    ? Math.random() * 3 + 2
    : config.category === 'equity' || config.category === 'index'
    ? Math.random() * 2.5 + 0.5
    : Math.random() * 2 + 1;
  
  const morningstarRating = Math.floor(Math.random() * 3) + 3;
  const inceptionYear = 2000 + Math.floor(Math.random() * 20);
  const minimumInvestment = config.type === 'etf' ? 0 : [0, 1000, 3000, 10000][Math.floor(Math.random() * 4)];
  
  const holdings = config.category === 'sector'
    ? Math.floor(Math.random() * 100) + 20
    : config.category === 'index'
    ? Math.floor(Math.random() * 3000) + 500
    : Math.floor(Math.random() * 500) + 50;
  
  const turnoverRate = config.category === 'index'
    ? Math.random() * 10 + 2
    : config.category === 'sector'
    ? Math.random() * 50 + 20
    : Math.random() * 30 + 10;

  return {
    symbol: config.symbol,
    name: config.name,
    type: config.type,
    category: config.category,
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    nav: parseFloat(price.toFixed(2)),
    totalAssets: config.totalAssets,
    expenseRatio: config.expenseRatio,
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

const generateFallbackIndex = (config: typeof FALLBACK_INDICES[0]): MarketIndex => {
  const change = generateRandomChange(config.baseValue, 0.015);
  const value = config.baseValue + change;
  const changePercent = (change / config.baseValue) * 100;
  
  return {
    symbol: config.symbol,
    name: config.name,
    value: parseFloat(value.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
  };
};

async function fetchYahooFinance(symbols: string[]): Promise<Map<string, any>> {
  const results = new Map();
  
  try {
    const symbolList = symbols.join(',');
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolList}&fields=symbol,longName,shortName,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume,marketCap,regularMarketDayHigh,regularMarketDayLow,regularMarketOpen,regularMarketPreviousClose`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      }
    );
    
    if (!response.ok) throw new Error('Yahoo Finance API error');
    
    const data = await response.json();
    if (data.quoteResponse?.result) {
      data.quoteResponse.result.forEach((quote: YahooFinanceQuote) => {
        results.set(quote.symbol, quote);
      });
    }
  } catch (error) {
    console.warn('Yahoo Finance fetch failed:', error);
  }
  
  return results;
}

async function fetchFinancialModelingPrep(symbols: string[]): Promise<Map<string, any>> {
  const results = new Map();
  
  try {
    const symbolList = symbols.join(',');
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbolList}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) throw new Error('FMP API error');
    
    const data = await response.json();
    if (Array.isArray(data)) {
      data.forEach((quote: any) => {
        results.set(quote.symbol, quote);
      });
    }
  } catch (error) {
    console.warn('Financial Modeling Prep fetch failed:', error);
  }
  
  return results;
}

export async function fetchStockData(symbols: string[]): Promise<Stock[]> {
  const cacheKey = `stocks:${symbols.join(',')}`;
  const cached = cache.get<Stock[]>(cacheKey);
  if (cached) return cached;
  
  let apiData = await fetchYahooFinance(symbols);
  
  if (apiData.size === 0) {
    apiData = await fetchFinancialModelingPrep(symbols);
  }
  
  const stocks: Stock[] = symbols.map(symbol => {
    const quote = apiData.get(symbol);
    const fallbackConfig = FALLBACK_STOCKS.find(s => s.symbol === symbol);
    
    if (quote && quote.regularMarketPrice) {
      return {
        symbol: quote.symbol,
        name: quote.longName || quote.shortName || fallbackConfig?.name || symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap || 0,
        high: quote.regularMarketDayHigh || quote.regularMarketPrice || 0,
        low: quote.regularMarketDayLow || quote.regularMarketPrice || 0,
        open: quote.regularMarketOpen || quote.regularMarketPrice || 0,
        previousClose: quote.regularMarketPreviousClose || quote.regularMarketPrice || 0,
        lastUpdated: new Date().toISOString(),
      };
    } else if (quote && quote.price) {
      return {
        symbol: quote.symbol,
        name: quote.name || fallbackConfig?.name || symbol,
        price: quote.price || 0,
        change: quote.change || 0,
        changePercent: quote.changesPercentage || 0,
        volume: quote.volume || 0,
        marketCap: quote.marketCap || 0,
        high: quote.dayHigh || quote.price || 0,
        low: quote.dayLow || quote.price || 0,
        open: quote.open || quote.price || 0,
        previousClose: quote.previousClose || quote.price || 0,
        lastUpdated: new Date().toISOString(),
      };
    }
    
    if (fallbackConfig) {
      return generateFallbackStock(fallbackConfig);
    }
    
    return generateFallbackStock({ symbol, name: symbol, basePrice: 100 });
  });
  
  cache.set(cacheKey, stocks);
  return stocks;
}

export async function fetchFundData(symbols: string[]): Promise<Fund[]> {
  const cacheKey = `funds:${symbols.join(',')}`;
  const cached = cache.get<Fund[]>(cacheKey);
  if (cached) return cached;
  
  const apiData = await fetchYahooFinance(symbols);
  
  const funds: Fund[] = symbols.map(symbol => {
    const quote = apiData.get(symbol);
    const fallbackConfig = FALLBACK_FUNDS.find(f => f.symbol === symbol);
    
    if (quote && quote.regularMarketPrice && fallbackConfig) {
      const change = quote.regularMarketChange || 0;
      const changePercent = quote.regularMarketChangePercent || 0;
      
      return {
        ...generateFallbackFund(fallbackConfig),
        price: quote.regularMarketPrice,
        change,
        changePercent,
        nav: quote.regularMarketPrice,
        lastUpdated: new Date().toISOString(),
      };
    }
    
    if (fallbackConfig) {
      return generateFallbackFund(fallbackConfig);
    }
    
    return generateFallbackFund({
      symbol,
      name: symbol,
      type: 'etf',
      category: 'index',
      basePrice: 100,
      expenseRatio: 0.1,
      totalAssets: 1000000000,
    });
  });
  
  cache.set(cacheKey, funds);
  return funds;
}

export async function fetchMarketIndices(): Promise<MarketIndex[]> {
  const cacheKey = 'indices:major';
  const cached = cache.get<MarketIndex[]>(cacheKey);
  if (cached) return cached;
  
  const yahooSymbols = ['^GSPC', '^DJI', '^IXIC', '^RUT'];
  const apiData = await fetchYahooFinance(yahooSymbols);
  
  const indices: MarketIndex[] = FALLBACK_INDICES.map((config, idx) => {
    const yahooSymbol = yahooSymbols[idx];
    const quote = apiData.get(yahooSymbol);
    
    if (quote && quote.regularMarketPrice) {
      return {
        symbol: config.symbol,
        name: config.name,
        value: quote.regularMarketPrice,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
      };
    }
    
    return generateFallbackIndex(config);
  });
  
  cache.set(cacheKey, indices);
  return indices;
}

export async function fetchAllStocks(): Promise<Stock[]> {
  const symbols = FALLBACK_STOCKS.map(s => s.symbol);
  return fetchStockData(symbols);
}

export async function fetchAllFunds(): Promise<Fund[]> {
  const symbols = FALLBACK_FUNDS.map(f => f.symbol);
  return fetchFundData(symbols);
}

export async function searchStocks(query: string): Promise<Stock[]> {
  const allStocks = await fetchAllStocks();
  const searchTerm = query.toLowerCase();
  
  return allStocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchTerm) || 
    stock.name.toLowerCase().includes(searchTerm)
  );
}

export async function searchFunds(query: string): Promise<Fund[]> {
  const allFunds = await fetchAllFunds();
  const searchTerm = query.toLowerCase();
  
  return allFunds.filter(fund => 
    fund.symbol.toLowerCase().includes(searchTerm) || 
    fund.name.toLowerCase().includes(searchTerm)
  );
}

export function clearCache(): void {
  cache.clear();
}

export function isMarketOpen(): boolean {
  const now = new Date();
  const day = now.getUTCDay();
  const hours = now.getUTCHours();
  
  if (day === 0 || day === 6) return false;
  
  const marketOpenUTC = 14.5;
  const marketCloseUTC = 21;
  
  return hours >= marketOpenUTC && hours < marketCloseUTC;
}
