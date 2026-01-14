import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Link2, Plug, User, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action?: () => void;
}

interface GetStartedCardProps {
  onCreateLink?: () => void;
}

export const GetStartedCard = ({ onCreateLink }: GetStartedCardProps) => {
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isDismissed, setIsDismissed] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'create-link',
      title: 'Create your first Ghost Link',
      description: 'Generate a tracking link for your product or social bio.',
      icon: Link2,
      action: onCreateLink,
    },
    {
      id: 'connect-revenue',
      title: 'Connect a Revenue Source',
      description: 'Sync sales from Stripe, Gumroad, or others.',
      icon: Plug,
      action: () => navigate('/integrations'),
    },
    {
      id: 'personalize',
      title: 'Personalize your Profile',
      description: 'Set your currency and display name.',
      icon: User,
      action: () => navigate('/settings'),
    },
  ];

  const progress = useMemo(() => {
    return (completedSteps.size / steps.length) * 100;
  }, [completedSteps.size, steps.length]);

  const isComplete = completedSteps.size === steps.length;

  const toggleStep = (stepId: string, action?: () => void) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
        // Trigger action when completing the step
        action?.();
      }
      return newSet;
    });
  };

  if (isDismissed) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden border-ghost/30 bg-gradient-to-br from-[hsl(170,50%,12%)] via-[hsl(165,45%,10%)] to-[hsl(160,40%,8%)]">
      {/* Dismiss button */}
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-ghost/20 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">
          {isComplete ? "You're all set! 🚀" : "Welcome to Ghost Link! 👋"}
        </CardTitle>
        {!isComplete && (
          <p className="text-sm text-muted-foreground">
            Let's get you set up in just a few steps.
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-primary font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-ghost/30" />
        </div>

        {isComplete ? (
          <div className="pt-2">
            <p className="text-sm text-muted-foreground mb-4">
              You've completed the setup. Start tracking your links and growing your revenue!
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="border-ghost/50 hover:bg-ghost/20"
            >
              Close Guide
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {steps.map((step) => {
              const isCompleted = completedSteps.has(step.id);
              const Icon = step.icon;

              return (
                <button
                  key={step.id}
                  onClick={() => toggleStep(step.id, step.action)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group ${
                    isCompleted
                      ? 'bg-success/10 border border-success/30'
                      : 'bg-ghost/10 border border-ghost/20 hover:bg-ghost/20 hover:border-ghost/40'
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'bg-success text-success-foreground'
                        : 'bg-ghost/30 text-muted-foreground group-hover:bg-ghost/50'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        isCompleted ? 'text-success line-through' : 'text-foreground'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    className={`flex-shrink-0 h-4 w-4 transition-transform ${
                      isCompleted
                        ? 'text-success'
                        : 'text-muted-foreground group-hover:translate-x-0.5'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
