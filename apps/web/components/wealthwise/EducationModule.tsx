import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight, CheckCircle } from '@phosphor-icons/react';
import { EducationModule as EducationModuleType } from '@/lib/wealthwise/education-content';

interface EducationModuleProps {
  module: EducationModuleType;
  onSelect: (moduleId: string) => void;
  completed?: boolean;
}

export function EducationModuleCard({ module, onSelect, completed }: EducationModuleProps) {
  const levelColors = {
    beginner: 'bg-success/10 text-success-foreground',
    intermediate: 'bg-accent/10 text-accent-foreground',
    advanced: 'bg-warning/10 text-warning-foreground',
  };

  return (
    <Card className="p-6 hover:border-accent transition-colors cursor-pointer" onClick={() => onSelect(module.id)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={20} weight="duotone" className="text-primary" />
          <Badge variant="secondary" className={levelColors[module.level]}>
            {module.level}
          </Badge>
        </div>
        {completed && (
          <CheckCircle size={20} weight="fill" className="text-success" />
        )}
      </div>
      
      <h3 className="font-semibold text-lg mb-2">{module.title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{module.duration}</span>
        <Button variant="ghost" size="sm" className="gap-2">
          Read More <ArrowRight size={16} weight="bold" />
        </Button>
      </div>
    </Card>
  );
}
