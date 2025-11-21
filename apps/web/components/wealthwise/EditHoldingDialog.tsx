import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Holding } from '@/lib/wealthwise/types';
import { Calendar } from '@phosphor-icons/react';

interface EditHoldingDialogProps {
  holding: Holding | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (holding: Holding) => void;
  onDelete: (holdingId: string) => void;
}

export function EditHoldingDialog({ holding, open, onOpenChange, onSave, onDelete }: EditHoldingDialogProps) {
  const [quantity, setQuantity] = useState<string>('');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>('');

  useEffect(() => {
    if (holding && open) {
      setQuantity(holding.quantity.toString());
      setPurchasePrice(holding.purchasePrice.toString());
      setPurchaseDate(holding.purchaseDate.split('T')[0]);
    }
  }, [holding, open]);

  const handleSave = () => {
    if (!holding) return;

    const updatedHolding: Holding = {
      ...holding,
      quantity: parseFloat(quantity) || holding.quantity,
      purchasePrice: parseFloat(purchasePrice) || holding.purchasePrice,
      purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : holding.purchaseDate,
    };

    onSave(updatedHolding);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!holding) return;
    if (confirm(`Are you sure you want to remove ${holding.symbol} from your portfolio?`)) {
      onDelete(holding.id);
      onOpenChange(false);
    }
  };

  if (!holding) return null;

  const isValid = 
    parseFloat(quantity) > 0 && 
    parseFloat(purchasePrice) > 0 && 
    purchaseDate !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Position</DialogTitle>
          <DialogDescription>
            Update {holding.symbol} - {holding.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-quantity">Quantity</Label>
            <Input
              id="edit-quantity"
              type="number"
              step="0.0001"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-purchase-price">Purchase Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="edit-purchase-price"
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-purchase-date">Purchase Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                id="edit-purchase-date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="pt-2 space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Current Price:</span>
              <span className="font-medium text-foreground">
                ${holding.currentPrice?.toFixed(2) || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Cost Basis:</span>
              <span className="font-medium text-foreground">
                ${(parseFloat(quantity || '0') * parseFloat(purchasePrice || '0')).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="sm:mr-auto"
          >
            Remove Position
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
