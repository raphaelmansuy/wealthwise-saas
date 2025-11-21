import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { searchStocks } from '@/lib/wealthwise/api-service';
import { Stock } from '@/lib/wealthwise/types';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSelectStock?: (stock: Stock) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSelectStock, onSearch, placeholder }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const performSearch = async () => {
      if (query.trim().length > 0) {
        const searchResults = await searchStocks(query);
        setResults(searchResults);
        setShowResults(true);
      } else {
        setResults([]);
        setShowResults(false);
      }
      // Notify parent about query changes (optional)
      if (onSearch) onSearch(query);
    };
    
    performSearch();
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStock = (stock: Stock) => {
    if (onSelectStock) onSelectStock(stock);
    setQuery('');
    setShowResults(false);
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative">
        <MagnifyingGlass 
          size={18} 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="text"
          placeholder={placeholder ?? 'Search stocks by symbol or name...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 0 && setShowResults(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => {
              setQuery('');
              setShowResults(false);
            }}
          >
            <X size={16} />
          </Button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 p-2">
          {results.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => handleSelectStock(stock)}
              className={cn(
                "w-full text-left p-3 rounded-md hover:bg-accent/10 transition-colors",
                "flex items-center justify-between gap-4"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{stock.symbol}</div>
                <div className="text-xs text-muted-foreground truncate">{stock.name}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-sm tabular-nums">${stock.price.toFixed(2)}</div>
                <div className={cn(
                  "text-xs font-medium tabular-nums",
                  stock.change >= 0 ? 'price-positive' : 'price-negative'
                )}>
                  {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </div>
              </div>
            </button>
          ))}
        </Card>
      )}

      {showResults && results.length === 0 && query.trim().length > 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 p-4 text-center">
          <p className="text-sm text-muted-foreground">No stocks found for "{query}"</p>
        </Card>
      )}
    </div>
  );
}
