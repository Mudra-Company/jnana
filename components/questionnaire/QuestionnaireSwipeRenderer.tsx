import React, { useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { Check, X, ChevronLeft, SkipForward } from 'lucide-react';
import { Question, QuestionOption, QuestionnaireSection } from '@/src/types/questionnaire';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// =============================================
// TYPES
// =============================================

// Re-export SwipeAnswer from scoringEngine for consistency
export type { SwipeAnswer } from '@/src/services/scoringEngine';
import type { SwipeAnswer } from '@/src/services/scoringEngine';

interface QuestionnaireSwipeRendererProps {
  sections: QuestionnaireSection[];
  onComplete: (answers: SwipeAnswer[]) => void;
  onBack?: () => void;
  primaryColor?: string;
  showProgress?: boolean;
  allowSkip?: boolean;
}

// =============================================
// CONSTANTS
// =============================================

const SWIPE_THRESHOLD = 100;
const ROTATION_RANGE = 15;
const SWIPE_VELOCITY_THRESHOLD = 500;

// =============================================
// SWIPE CARD COMPONENT
// =============================================

interface SwipeCardProps {
  question: Question;
  onSwipe: (direction: 'left' | 'right', optionId?: string) => void;
  onSkip?: () => void;
  isActive: boolean;
  index: number;
  totalCards: number;
}

const SwipeCard: React.FC<SwipeCardProps> = ({
  question,
  onSwipe,
  onSkip,
  isActive,
  index,
  totalCards,
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-ROTATION_RANGE, ROTATION_RANGE]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  // Indicator opacity based on swipe direction
  const leftIndicatorOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const rightIndicatorOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const shouldSwipe = 
        Math.abs(info.offset.x) > SWIPE_THRESHOLD || 
        Math.abs(info.velocity.x) > SWIPE_VELOCITY_THRESHOLD;

      if (shouldSwipe) {
        const direction = info.offset.x > 0 ? 'right' : 'left';
        const targetX = direction === 'right' ? 500 : -500;
        
        animate(x, targetX, {
          type: 'spring',
          stiffness: 300,
          damping: 30,
          onComplete: () => {
            // For binary questions, right = first option, left = second option
            const optionId = question.options?.[direction === 'right' ? 0 : 1]?.id;
            onSwipe(direction, optionId);
          },
        });
      } else {
        animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
      }
    },
    [x, onSwipe, question.options]
  );

  // Stack effect for cards behind
  const stackOffset = (totalCards - 1 - index) * 4;
  const stackScale = 1 - (totalCards - 1 - index) * 0.02;

  if (!isActive && index < totalCards - 3) return null;

  return (
    <motion.div
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        !isActive && "pointer-events-none"
      )}
      style={{
        zIndex: index,
      }}
    >
      <motion.div
        className={cn(
          "relative w-full max-w-sm mx-4 bg-card rounded-3xl shadow-2xl overflow-hidden",
          "border border-border/50",
          isActive ? "cursor-grab active:cursor-grabbing" : ""
        )}
        style={{
          x: isActive ? x : 0,
          rotate: isActive ? rotate : 0,
          opacity: isActive ? opacity : 0.7,
          y: isActive ? 0 : stackOffset,
          scale: isActive ? 1 : stackScale,
        }}
        drag={isActive ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        onDragEnd={isActive ? handleDragEnd : undefined}
        initial={isActive ? { scale: 0.95, opacity: 0 } : {}}
        animate={isActive ? { scale: 1, opacity: 1 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Swipe Indicators */}
        {isActive && (
          <>
            <motion.div
              className="absolute top-6 left-6 z-10 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground font-bold text-lg rotate-[-15deg] border-4 border-destructive-foreground"
              style={{ opacity: leftIndicatorOpacity }}
            >
              {question.options?.[1]?.text || 'NO'}
            </motion.div>
            <motion.div
              className="absolute top-6 right-6 z-10 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-lg rotate-[15deg] border-4 border-primary-foreground"
              style={{ opacity: rightIndicatorOpacity }}
            >
              {question.options?.[0]?.text || 'SÌ'}
            </motion.div>
          </>
        )}

        {/* Card Content */}
        <div className="p-8 min-h-[400px] flex flex-col justify-center">
          {/* Question Image */}
          {question.imageUrl && (
            <div className="mb-6 flex justify-center">
              <img
                src={question.imageUrl}
                alt=""
                className="w-32 h-32 object-cover rounded-2xl"
              />
            </div>
          )}

          {/* Question Icon */}
          {question.icon && (
            <div className="mb-6 flex justify-center">
              <span className="text-6xl">{question.icon}</span>
            </div>
          )}

          {/* Question Text */}
          <h2 className="text-xl md:text-2xl font-semibold text-center text-foreground leading-relaxed">
            {question.text}
          </h2>

          {/* Help Text */}
          {question.config?.helpText && (
            <p className="mt-4 text-sm text-muted-foreground text-center">
              {question.config.helpText}
            </p>
          )}

          {/* Binary Options Labels */}
          {question.type === 'binary' && question.options && (
            <div className="mt-8 flex justify-between px-4">
              <div className="flex items-center gap-2 text-destructive">
                <X className="w-5 h-5" />
                <span className="text-sm font-medium">{question.options[1]?.text || 'No'}</span>
              </div>
              <div className="flex items-center gap-2 text-primary">
                <span className="text-sm font-medium">{question.options[0]?.text || 'Sì'}</span>
                <Check className="w-5 h-5" />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// =============================================
// LIKERT SWIPE CARD
// =============================================

interface LikertSwipeCardProps {
  question: Question;
  onAnswer: (value: number) => void;
  onSkip?: () => void;
  isActive: boolean;
}

const LikertSwipeCard: React.FC<LikertSwipeCardProps> = ({
  question,
  onAnswer,
  isActive,
}) => {
  const [selectedValue, setSelectedValue] = useState<number | null>(null);

  const likertOptions = [
    { value: 1, label: 'Per niente', emoji: '😞' },
    { value: 2, label: 'Poco', emoji: '😕' },
    { value: 3, label: 'Abbastanza', emoji: '😐' },
    { value: 4, label: 'Molto', emoji: '🙂' },
    { value: 5, label: 'Moltissimo', emoji: '😄' },
  ];

  const handleSelect = (value: number) => {
    setSelectedValue(value);
    setTimeout(() => onAnswer(value), 300);
  };

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0, x: 300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="w-full max-w-sm mx-4 bg-card rounded-3xl shadow-2xl overflow-hidden border border-border/50 p-8">
        {/* Question */}
        <h2 className="text-xl font-semibold text-center text-foreground mb-8 leading-relaxed">
          {question.text}
        </h2>

        {/* Likert Scale */}
        <div className="space-y-3">
          {likertOptions.map((option) => (
            <motion.button
              key={option.value}
              className={cn(
                "w-full p-4 rounded-2xl border-2 transition-all",
                "flex items-center gap-4",
                selectedValue === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
              onClick={() => handleSelect(option.value)}
              whileTap={{ scale: 0.98 }}
              disabled={!isActive}
            >
              <span className="text-2xl">{option.emoji}</span>
              <span className="text-foreground font-medium">{option.label}</span>
              {selectedValue === option.value && (
                <motion.div
                  className="ml-auto"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <Check className="w-5 h-5 text-primary" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// =============================================
// MAIN RENDERER
// =============================================

export const QuestionnaireSwipeRenderer: React.FC<QuestionnaireSwipeRendererProps> = ({
  sections,
  onComplete,
  onBack,
  showProgress = true,
  allowSkip = false,
}) => {
  // Flatten all questions from sections
  const allQuestions = sections.flatMap((section) => section.questions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<SwipeAnswer[]>([]);

  const currentQuestion = allQuestions[currentIndex];
  const progress = ((currentIndex) / allQuestions.length) * 100;
  const isLastQuestion = currentIndex === allQuestions.length - 1;

  const handleSwipe = useCallback(
    (direction: 'left' | 'right', optionId?: string) => {
      const answer: SwipeAnswer = {
        questionId: currentQuestion.id,
        selectedOptionId: optionId,
        swipeDirection: direction,
      };

      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);

      if (isLastQuestion) {
        onComplete(newAnswers);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentQuestion, answers, isLastQuestion, onComplete]
  );

  const handleLikertAnswer = useCallback(
    (value: number) => {
      const answer: SwipeAnswer = {
        questionId: currentQuestion.id,
        likertValue: value,
      };

      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);

      if (isLastQuestion) {
        onComplete(newAnswers);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentQuestion, answers, isLastQuestion, onComplete]
  );

  const handleSkip = useCallback(() => {
    if (!allowSkip) return;
    
    const answer: SwipeAnswer = {
      questionId: currentQuestion.id,
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (isLastQuestion) {
      onComplete(newAnswers);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentQuestion, answers, isLastQuestion, allowSkip, onComplete]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setAnswers((prev) => prev.slice(0, -1));
    } else if (onBack) {
      onBack();
    }
  }, [currentIndex, onBack]);

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Nessuna domanda disponibile</p>
      </div>
    );
  }

  const isLikert = currentQuestion.type === 'likert';
  const isBinaryOrSingleChoice = currentQuestion.type === 'binary' || currentQuestion.type === 'single_choice';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <div className="safe-area-top px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-muted-foreground"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Indietro
          </Button>

          {allowSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Salta
              <SkipForward className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Progress */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Domanda {currentIndex + 1} di {allQuestions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>

      {/* Cards Container */}
      <div className="flex-1 relative overflow-hidden">
        {isLikert ? (
          <LikertSwipeCard
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleLikertAnswer}
            onSkip={allowSkip ? handleSkip : undefined}
            isActive={true}
          />
        ) : isBinaryOrSingleChoice ? (
          // Render stack of cards for swipe
          <>
            {allQuestions.slice(currentIndex, currentIndex + 3).map((q, idx) => (
              <SwipeCard
                key={q.id}
                question={q}
                onSwipe={handleSwipe}
                onSkip={allowSkip ? handleSkip : undefined}
                isActive={idx === 0}
                index={currentIndex + idx}
                totalCards={Math.min(3, allQuestions.length - currentIndex)}
              />
            ))}
          </>
        ) : (
          // Fallback for other question types
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-card rounded-3xl shadow-2xl p-8 border border-border/50">
              <h2 className="text-xl font-semibold text-center mb-6">
                {currentQuestion.text}
              </h2>
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <Button
                    key={option.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-4 px-6"
                    onClick={() => handleSwipe('right', option.id)}
                  >
                    {option.icon && <span className="mr-3">{option.icon}</span>}
                    {option.text}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons for Binary Questions */}
      {isBinaryOrSingleChoice && (
        <div className="safe-area-bottom px-8 pb-8">
          <div className="flex justify-center gap-8">
            <motion.button
              className="w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive flex items-center justify-center"
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe('left', currentQuestion.options?.[1]?.id)}
            >
              <X className="w-8 h-8 text-destructive" />
            </motion.button>
            <motion.button
              className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center"
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe('right', currentQuestion.options?.[0]?.id)}
            >
              <Check className="w-8 h-8 text-primary" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionnaireSwipeRenderer;
