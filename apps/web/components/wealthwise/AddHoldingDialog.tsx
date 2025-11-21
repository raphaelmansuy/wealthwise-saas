import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssetType, Holding, Stock, Fund } from '@/lib/wealthwise/types';
import { generateHoldingId } from '@/lib/wealthwise/portfolio-utils';
import { fetchAllStocks, fetchAllFunds } from '@/lib/wealthwise/api-service';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChartLine, Vault } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AddHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (holding: Holding) => void;
}

export function AddHoldingDialog({ open, onOpenChange, onAdd }: AddHoldingDialogProps) {
  const [assetCategory, setAssetCategory] = useState<'stocks' | 'funds'>('stocks');
  const [searchOpen, setSearchOpen] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>('stock');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [stocksData, fundsData] = await Promise.all([
          fetchAllStocks(),
          fetchAllFunds(),
        ]);
        setStocks(stocksData);
        setFunds(fundsData);
      } catch (error) {
        console.error('Failed to load asset data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (open) {
      loadData();
    }
  }, [open]);

  const handleSelectAsset = (assetSymbol: string, assetName: string, assetType: AssetType, currentPrice: number) => {
    setSymbol(assetSymbol);
    setName(assetName);
    setType(assetType);
    setPurchasePrice(currentPrice.toString());
    setSearchOpen(false);
  };

  const handleAdd = () => {
    if (!symbol || !name || !quantity || !purchasePrice) return;

    const holding: Holding = {
      id: generateHoldingId(),
      symbol,
      name,
      type,
      quantity: parseFloat(quantity),
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate,
    };

    onAdd(holding);
    
    setSymbol('');
    setName('');
    setType('stock');
    setQuantity('');
    setPurchasePrice('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setAssetCategory('stocks');
    onOpenChange(false);
  };

  const isValid = symbol && name && quantity && purchasePrice && parseFloat(quantity) > 0 && parseFloat(purchasePrice) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Position to Portfolio</DialogTitle>
        </DialogHeader>

        <Tabs value={assetCategory} onValueChange={(v) => setAssetCategory(v as 'stocks' | 'funds')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stocks">
              <ChartLine size={16} className="mr-2" weight="bold" />
              Stocks
            </TabsTrigger>
            <TabsTrigger value="funds">
              <Vault size={16} className="mr-2" weight="bold" />
              Funds
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stocks" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Stock Symbol *</Label>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="symbol"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {symbol && type === 'stock' ? symbol : 'Search for a stock...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search stocks..." />
                    <CommandList>
                      <CommandEmpty>No stocks found.</CommandEmpty>
                      <CommandGroup>
                        {stocks.map((stock) => (
                          <CommandItem
                            key={stock.symbol}
                            value={stock.symbol}
                            onSelect={() => handleSelectAsset(stock.symbol, stock.name, 'stock', stock.price)}
                          >
                            <Check
                              className={cn(
                                'mr-2',
                                symbol === stock.symbol ? 'opacity-100' : 'opacity-0'
                              )}
                              size={16}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{stock.symbol}</div>
                                <div className="text-sm text-muted-foreground">${stock.price.toFixed(2)}</div>
                              </div>
                              <div className="text-xs text-muted-foreground">{stock.name}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Asset Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as AssetType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="bond">Bond</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="funds" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="fund-symbol">Fund Symbol *</Label>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="fund-symbol"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {symbol && (type === 'etf' || type === 'mutual-fund') ? symbol : 'Search for a fund...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search funds..." />
                    <CommandList>
                      <CommandEmpty>No funds found.</CommandEmpty>
                      <CommandGroup>
                        {funds.map((fund) => (
                          <CommandItem
                            key={fund.symbol}
                            value={fund.symbol}
                            onSelect={() => handleSelectAsset(fund.symbol, fund.name, fund.type, fund.price)}
                          >
                            <Check
                              className={cn(
                                'mr-2',
                                symbol === fund.symbol ? 'opacity-100' : 'opacity-0'
                              )}
                              size={16}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{fund.symbol}</span>
                                  <Badge variant="outline" className="text-xs uppercase">
                                    {fund.type}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">${fund.price.toFixed(2)}</div>
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-1">{fund.name}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                min="0"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase-price">Purchase Price *</Label>
              <div className="relative">
                <Input
                  id="purchase-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
                {symbol && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Current market price
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase-date">Purchase Date</Label>
            <Input
              id="purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!isValid}>
            Add Position
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
