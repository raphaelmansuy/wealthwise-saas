import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Newspaper } from '@phosphor-icons/react';
import { NewsArticle } from '@/lib/wealthwise/types';
import { formatDistanceToNow } from 'date-fns';

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
  
  return (
    <Card className="p-5 hover:shadow-md transition-all duration-150 hover:border-accent cursor-pointer group">
      <a 
        href={article.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-accent/10 rounded-lg shrink-0">
            <Newspaper size={20} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-snug mb-2 group-hover:text-accent transition-colors">
              {article.headline}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {article.summary}
            </p>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-medium">{article.source}</span>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{timeAgo}</span>
                </div>
              </div>
              {article.relatedSymbols.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {article.relatedSymbols.slice(0, 3).map(symbol => (
                    <Badge key={symbol} variant="secondary" className="text-xs">
                      {symbol}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </a>
    </Card>
  );
}
