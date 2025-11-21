import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, CheckCircle, Warning } from '@phosphor-icons/react';

interface DataFreshnessIndicatorProps {
  lastUpdated: string;
  className?: string;
}

export function DataFreshnessIndicator({ lastUpdated, className }: DataFreshnessIndicatorProps) {
  const getTimeSinceUpdate = () => {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffMs = now.getTime() - updated.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    
    if (diffSec < 30) return { text: 'Live', variant: 'default' as const, icon: CheckCircle };
    if (diffSec < 60) return { text: `${diffSec}s ago`, variant: 'default' as const, icon: Clock };
    if (diffMin < 60) return { text: `${diffMin}m ago`, variant: 'secondary' as const, icon: Clock };
    if (diffHour < 24) return { text: `${diffHour}h ago`, variant: 'secondary' as const, icon: Warning };
    return { text: 'Stale', variant: 'destructive' as const, icon: Warning };
  };
  
  const { text, variant, icon: Icon } = getTimeSinceUpdate();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className={className}>
            <Icon size={12} className="mr-1" weight="bold" />
            {text}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
