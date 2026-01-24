import React, { useState, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { Check, X, ChevronLeft, SkipForward } from 'lucide-react';
import { Question, QuestionOption, QuestionnaireSection } from '../../src/types/questionnaire';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';

// =============================================
// TYPES
// =============================================

// Re-export SwipeAnswer from scoringEngine for consistency
export type { SwipeAnswer } from '../../src/services/scoringEngine';
import type { SwipeAnswer } from '../../src/services/scoringEngine';

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
        "absolute inset-4 md:inset-8 flex items-center justify-center",
        !isActive && "pointer-events-none"
      )}
      style={{
        zIndex: index,
      }}
    >
      <motion.div
        className={cn(
          "relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl overflow-hidden",
          "shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]",
          "border border-slate-200/80 dark:border-gray-700/50",
          isActive ? "cursor-grab active:cursor-grabbing" : ""
        )}
        style={{
          x: isActive ? x : 0,
          rotate: isActive ? rotate : 0,
          opacity: isActive ? opacity : 0.6,
          y: isActive ? 0 : stackOffset,
          scale: isActive ? 1 : stackScale,
        }}
        drag={isActive ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        onDragEnd={isActive ? handleDragEnd : undefined}
        initial={isActive ? { scale: 0.9, opacity: 0, y: 30 } : {}}
        animate={isActive ? { scale: 1, opacity: 1, y: 0 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Swipe Indicators - More visible */}
        {isActive && (
          <>
            <motion.div
              className="absolute top-8 left-6 z-20 px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold text-lg uppercase tracking-wide rotate-[-12deg] shadow-lg"
              style={{ opacity: leftIndicatorOpacity }}
            >
              {question.options?.[1]?.text || 'NO'}
            </motion.div>
            <motion.div
              className="absolute top-8 right-6 z-20 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-lg uppercase tracking-wide rotate-[12deg] shadow-lg"
              style={{ opacity: rightIndicatorOpacity }}
            >
              {question.options?.[0]?.text || 'SÌ'}
            </motion.div>
          </>
        )}

        {/* Card Content */}
        <div className="p-6 md:p-8 min-h-[400px] flex flex-col justify-between bg-gradient-to-b from-white to-slate-50 dark:from-gray-900 dark:to-gray-800">
          {/* Top Section: Image/Icon and Question */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Question Image */}
            {question.imageUrl && (
              <div className="mb-6 flex justify-center">
                <img
                  src={question.imageUrl}
                  alt=""
                  className="w-32 h-32 object-cover rounded-2xl shadow-md"
                />
              </div>
            )}

            {/* Question Icon */}
            {question.icon && (
              <div className="mb-6 flex justify-center">
                <span className="text-6xl drop-shadow-md">{question.icon}</span>
              </div>
            )}

            {/* Question Text - Always visible */}
            <h2 className="text-xl md:text-2xl font-bold text-center text-slate-800 dark:text-slate-100 leading-relaxed px-2">
              {question.text || '⚠️ Domanda senza testo'}
            </h2>

            {/* Help Text */}
            {question.config?.helpText && (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 text-center">
                {question.config.helpText}
              </p>
            )}
          </div>

          {/* Swipe instruction hint */}
          {(question.type === 'binary' || question.type === 'single_choice') && question.options && question.options.length >= 2 && (
            <div className="mt-8 text-center">
              <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Swippa o usa i bottoni
              </span>
            </div>
          )}

          {/* Warning for questions without options */}
          {(!question.options || question.options.length === 0) && question.type !== 'likert' && (
            <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
              <span className="text-amber-600 dark:text-amber-400 text-sm">
                ⚠️ Nessuna opzione configurata per questa domanda
              </span>
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
      className="absolute inset-4 md:inset-8 flex items-center justify-center"
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, x: 300 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-200/80 dark:border-gray-700/50">
        <div className="p-8 md:p-10 bg-gradient-to-b from-white to-slate-50 dark:from-gray-900 dark:to-gray-800">
          {/* Question */}
          <h2 className="text-xl md:text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-8 leading-relaxed">
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
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                    : "border-slate-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-gray-800"
                )}
                onClick={() => handleSelect(option.value)}
                whileTap={{ scale: 0.98 }}
                disabled={!isActive}
              >
                <span className="text-3xl">{option.emoji}</span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">{option.label}</span>
                {selectedValue === option.value && (
                  <motion.div
                    className="ml-auto"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Check className="w-6 h-6 text-indigo-500" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
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
  const [keyPressed, setKeyPressed] = useState<'left' | 'right' | null>(null);

  const currentQuestion = allQuestions[currentIndex];
  const progress = ((currentIndex) / allQuestions.length) * 100;
  const isLastQuestion = currentIndex === allQuestions.length - 1;
  const isLikert = currentQuestion?.type === 'likert';
  const isBinaryOrSingleChoice = currentQuestion?.type === 'binary' || currentQuestion?.type === 'single_choice';

  const handleSwipe = useCallback(
    (direction: 'left' | 'right', optionId?: string) => {
      if (!currentQuestion) return;
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
      if (!currentQuestion) return;
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
    if (!allowSkip || !currentQuestion) return;
    
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

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isBinaryOrSingleChoice || !currentQuestion?.options || currentQuestion.options.length < 2) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setKeyPressed('left');
        handleSwipe('left', currentQuestion.options[1]?.id);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setKeyPressed('right');
        handleSwipe('right', currentQuestion.options[0]?.id);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, isBinaryOrSingleChoice, handleSwipe]);

  // Reset keyPressed after animation
  useEffect(() => {
    if (keyPressed) {
      const timer = setTimeout(() => setKeyPressed(null), 200);
      return () => clearTimeout(timer);
    }
  }, [keyPressed]);

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Nessuna domanda disponibile</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[500px] flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      {/* Header with progress */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-gray-800/50">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Indietro
          </Button>

          {allowSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Salta
              <SkipForward className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Progress */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Domanda {currentIndex + 1} di {allQuestions.length}
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2.5 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Cards Container - takes remaining space */}
      <div className="flex-1 relative overflow-hidden min-h-[400px]">
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
          <div className="absolute inset-4 md:inset-8 flex items-center justify-center">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] p-8 border border-slate-200/80 dark:border-gray-700/50">
              <h2 className="text-xl font-bold text-center text-slate-800 dark:text-slate-100 mb-6">
                {currentQuestion.text}
              </h2>
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <Button
                    key={option.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-4 px-6 rounded-xl border-2 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    onClick={() => handleSwipe('right', option.id)}
                  >
                    {option.icon && <span className="mr-3 text-xl">{option.icon}</span>}
                    <span className="font-medium">{option.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons for Binary Questions */}
      {isBinaryOrSingleChoice && currentQuestion.options && currentQuestion.options.length >= 2 && (
        <div className="flex-shrink-0 px-4 pb-6 pt-4 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900">
          <div className="flex flex-col items-center gap-3">
            <div className="flex justify-center items-end gap-6">
              {/* Left Option Button */}
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  className={cn(
                    "w-16 h-16 md:w-18 md:h-18 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-[0_8px_25px_-5px_rgba(239,68,68,0.5)] hover:shadow-[0_12px_30px_-5px_rgba(239,68,68,0.6)] transition-all",
                    keyPressed === 'left' && "ring-4 ring-red-300 scale-110"
                  )}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSwipe('left', currentQuestion.options?.[1]?.id)}
                >
                  <X className="w-7 h-7 md:w-8 md:h-8 text-white" strokeWidth={3} />
                </motion.button>
                <span className="text-xs font-medium text-red-600 dark:text-red-400 max-w-[90px] text-center line-clamp-2">
                  {currentQuestion.options[1]?.text || 'No'}
                </span>
              </div>
              
              {/* Right Option Button */}
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  className={cn(
                    "w-16 h-16 md:w-18 md:h-18 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_8px_25px_-5px_rgba(16,185,129,0.5)] hover:shadow-[0_12px_30px_-5px_rgba(16,185,129,0.6)] transition-all",
                    keyPressed === 'right' && "ring-4 ring-emerald-300 scale-110"
                  )}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSwipe('right', currentQuestion.options?.[0]?.id)}
                >
                  <Check className="w-7 h-7 md:w-8 md:h-8 text-white" strokeWidth={3} />
                </motion.button>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 max-w-[90px] text-center line-clamp-2">
                  {currentQuestion.options[0]?.text || 'Sì'}
                </span>
              </div>
            </div>
            
            {/* Keyboard hints - visible only on desktop */}
            <div className="hidden md:flex justify-center gap-8 text-xs text-slate-400 dark:text-slate-500">
              <span>← Freccia sinistra</span>
              <span>Freccia destra →</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionnaireSwipeRenderer;
