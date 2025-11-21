import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIInsight } from '@/lib/wealthwise/types';
import { Lightbulb, Warning, Sparkle, Check, X, CaretDown, CaretUp } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AIInsightCardProps {
  insight: AIInsight;
  onDismiss?: (id: string) => void;
  onImplement?: (id: string) => void;
}

export function AIInsightCard({ insight, onDismiss, onImplement }: AIInsightCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getIcon = () => {
    switch (insight.type) {
      case 'warning':
        return <Warning size={20} weight="bold" className="text-warning" />;
      case 'opportunity':
        return <Sparkle size={20} weight="fill" className="text-accent" />;
      default:
        return <Lightbulb size={20} weight="fill" className="text-accent" />;
    }
  };

  const getPriorityColor = () => {
    switch (insight.priority) {
      case 'high':
        return 'border-l-warning';
      case 'medium':
        return 'border-l-accent';
      default:
        return 'border-l-muted';
    }
  };

  if (insight.dismissed) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('p-6 border-l-4', getPriorityColor())}>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-accent/10 rounded-lg shrink-0 mt-1">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="font-semibold text-base">{insight.title}</h4>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {insight.confidence}% confidence
                  </Badge>
                  {insight.priority === 'high' && (
                    <Badge variant="secondary" className="text-xs bg-warning/10 text-warning border-warning/20">
                      Priority
                    </Badge>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>

              {!expanded && insight.reasoning && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs -ml-2 h-auto py-1"
                  onClick={() => setExpanded(true)}
                >
                  <CaretDown size={14} className="mr-1" />
                  Show reasoning
                </Button>
              )}

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-4 bg-muted/30 rounded-lg space-y-3">
                      <div>
                        <p className="text-xs font-medium mb-1">AI Reasoning:</p>
                        <p className="text-sm text-muted-foreground">{insight.reasoning}</p>
                      </div>

                      {insight.actions && insight.actions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-2">Recommended Actions:</p>
                          <ul className="space-y-1">
                            {insight.actions.map((action, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <Check size={14} className="text-accent mt-0.5 shrink-0" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs -ml-2 h-auto py-1 mt-2"
                      onClick={() => setExpanded(false)}
                    >
                      <CaretUp size={14} className="mr-1" />
                      Hide details
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {insight.actionable && !insight.implemented && onImplement && (
              <Button size="sm" onClick={() => onImplement(insight.id)}>
                Take Action
              </Button>
            )}
            {onDismiss && (
              <Button variant="outline" size="sm" onClick={() => onDismiss(insight.id)}>
                <X size={14} className="mr-1" />
                Dismiss
              </Button>
            )}
            {insight.implemented && (
              <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                <Check size={12} className="mr-1" weight="bold" />
                Implemented
              </Badge>
            )}
          </div>

          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground italic">
              ⚠️ AI-generated suggestion, not financial advice. Consult a professional advisor before making investment decisions.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
