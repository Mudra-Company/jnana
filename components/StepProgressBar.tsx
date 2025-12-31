import React from 'react';
import { Check, Hexagon, ThermometerSun, Sparkles } from 'lucide-react';

export type TestStep = 'riasec' | 'climate' | 'karma';

interface StepProgressBarProps {
  currentStep: TestStep;
  completedSteps: TestStep[];
}

const STEPS = [
  { id: 'riasec' as TestStep, label: 'RIASEC', icon: Hexagon },
  { id: 'climate' as TestStep, label: 'Clima', icon: ThermometerSun },
  { id: 'karma' as TestStep, label: 'Karma AI', icon: Sparkles },
];

export const StepProgressBar: React.FC<StepProgressBarProps> = ({ currentStep, completedSteps }) => {
  const getStepStatus = (stepId: TestStep) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'pending';
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line Background */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 z-0" />
        
        {/* Progress Line Filled */}
        <div 
          className="absolute top-5 left-0 h-0.5 bg-jnana-sage transition-all duration-500 z-0"
          style={{ 
            width: currentStep === 'riasec' ? '0%' : currentStep === 'climate' ? '50%' : '100%' 
          }}
        />

        {STEPS.map((step, index) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="flex flex-col items-center z-10 relative">
              {/* Circle */}
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                ${status === 'completed' 
                  ? 'bg-jnana-sage text-white shadow-lg shadow-jnana-sage/30' 
                  : status === 'current' 
                    ? 'bg-white dark:bg-gray-800 border-2 border-jnana-sage text-jnana-sage shadow-lg' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700'
                }
              `}>
                {status === 'completed' ? (
                  <Check size={18} strokeWidth={3} />
                ) : (
                  <Icon size={18} />
                )}
              </div>
              
              {/* Label */}
              <span className={`
                mt-2 text-xs font-bold uppercase tracking-wider transition-colors
                ${status === 'completed' 
                  ? 'text-jnana-sage' 
                  : status === 'current' 
                    ? 'text-jnana-sage' 
                    : 'text-gray-400'
                }
              `}>
                {step.label}
              </span>
              
              {/* Status Text */}
              <span className={`
                text-[10px] mt-0.5
                ${status === 'completed' 
                  ? 'text-jnana-sage/70' 
                  : status === 'current' 
                    ? 'text-gray-500' 
                    : 'text-gray-300 dark:text-gray-600'
                }
              `}>
                {status === 'completed' ? 'Completato' : status === 'current' ? 'In corso' : 'Da fare'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
