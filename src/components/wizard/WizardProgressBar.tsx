import { Check, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Step {
  id: string;
  label: string;
}

interface WizardProgressBarProps {
  steps: Step[];
  currentStep: string;
  onBack?: () => void;
  onStepClick?: (stepId: string) => void;
  showBackButton?: boolean;
}

export const WizardProgressBar = ({
  steps,
  currentStep,
  onBack,
  onStepClick,
  showBackButton = true,
}: WizardProgressBarProps) => {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  const handleStepClick = (stepId: string, index: number) => {
    // Only allow clicking on completed steps (not current or future)
    if (index < currentIndex && onStepClick) {
      onStepClick(stepId);
    }
  };

  return (
    <div className="flex items-center gap-3 mb-6">
      {/* Back Button */}
      {showBackButton && currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8 shrink-0"
          aria-label="Go back"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-between flex-1 px-2">
        {steps.map((step, index) => {
          const isCompleted = currentIndex > index;
          const isCurrent = currentIndex === index;
          const isClickable = index < currentIndex;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle + Label */}
              <button
                onClick={() => handleStepClick(step.id, index)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-2 transition-all duration-200",
                  isClickable && "cursor-pointer hover:opacity-80",
                  !isClickable && "cursor-default"
                )}
                aria-label={`${step.label}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isCompleted 
                      ? 'hsl(var(--success))' 
                      : isCurrent 
                        ? 'hsl(var(--primary))' 
                        : 'hsl(var(--muted))',
                  }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                    isCompleted && "text-success-foreground",
                    isCurrent && "text-primary-foreground",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </motion.div>
                <span
                  className={cn(
                    "text-xs font-medium hidden sm:inline transition-colors",
                    isCurrent && "text-foreground",
                    isCompleted && "text-muted-foreground",
                    !isCompleted && !isCurrent && "text-muted-foreground/60"
                  )}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="mx-2 sm:mx-3 flex-1 min-w-[16px] sm:min-w-[24px]">
                  <div
                    className={cn(
                      "h-0.5 w-full rounded-full transition-colors duration-200",
                      currentIndex > index ? "bg-success/50" : "bg-border"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
