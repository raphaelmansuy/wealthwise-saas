import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  CheckCircle, 
  Lightbulb, 
  ListChecks, 
  ChartLine,
  BookOpen,
  Target
} from '@phosphor-icons/react';
import { EducationModule } from '@/lib/wealthwise/education-content';

interface EducationDetailProps {
  module: EducationModule;
  onBack: () => void;
  onComplete: (moduleId: string) => void;
  completed?: boolean;
  relatedModules: EducationModule[];
  onSelectRelated: (moduleId: string) => void;
}

export function EducationDetail({ 
  module, 
  onBack, 
  onComplete, 
  completed,
  relatedModules,
  onSelectRelated 
}: EducationDetailProps) {
  const levelColors = {
    beginner: 'bg-success/10 text-success-foreground',
    intermediate: 'bg-accent/10 text-accent-foreground',
    advanced: 'bg-warning/10 text-warning-foreground',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} weight="bold" className="mr-2" />
          Back to Library
        </Button>
      </div>

      <Card className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen size={32} weight="duotone" className="text-primary" />
            <div>
              <h1 className="text-2xl font-semibold mb-2">{module.title}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={levelColors[module.level]}>
                  {module.level}
                </Badge>
                <span className="text-sm text-muted-foreground">{module.duration}</span>
              </div>
            </div>
          </div>
          {completed ? (
            <Badge variant="outline" className="gap-2">
              <CheckCircle size={16} weight="fill" className="text-success" />
              Completed
            </Badge>
          ) : (
            <Button onClick={() => onComplete(module.id)}>
              Mark Complete
            </Button>
          )}
        </div>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Lightbulb size={20} weight="bold" />
                Overview
              </h2>
              <p className="text-foreground leading-relaxed">{module.content.overview}</p>
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ListChecks size={20} weight="bold" />
                Key Points
              </h2>
              <ul className="space-y-3">
                {module.content.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle size={20} weight="fill" className="text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {module.content.examples && module.content.examples.length > 0 && (
              <>
                <Separator />
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ChartLine size={20} weight="bold" />
                    Examples
                  </h2>
                  <div className="space-y-3">
                    {module.content.examples.map((example, idx) => (
                      <div key={idx} className="p-4 bg-muted/50 rounded-lg border border-border">
                        <p className="text-foreground">{example}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {module.content.actionableSteps && module.content.actionableSteps.length > 0 && (
              <>
                <Separator />
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target size={20} weight="bold" />
                    Action Steps
                  </h2>
                  <ol className="space-y-3">
                    {module.content.actionableSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-foreground pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </Card>

      {relatedModules.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Related Topics</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {relatedModules.map(related => (
              <Card 
                key={related.id} 
                className="p-4 hover:border-accent transition-colors cursor-pointer"
                onClick={() => onSelectRelated(related.id)}
              >
                <Badge variant="secondary" className={`${levelColors[related.level]} mb-2`}>
                  {related.level}
                </Badge>
                <h3 className="font-semibold mb-2">{related.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{related.description}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
