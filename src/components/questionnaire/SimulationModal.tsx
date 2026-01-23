// =============================================
// SIMULATION MODAL
// Full-screen modal for testing questionnaires without saving data
// =============================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, RotateCcw, CheckCircle2, BarChart3, FileText, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '../../../components/Card';
import { Progress } from '@/components/ui/progress';
import { QuestionnaireSwipeRenderer } from '../../../components/questionnaire/QuestionnaireSwipeRenderer';
import { calculateScores, type SwipeAnswer, type ScoringOutput } from '../../services/scoringEngine';
import type { Questionnaire } from '../../types/questionnaire';

// =============================================
// TYPES
// =============================================

interface SimulationModalProps {
  questionnaire: Questionnaire;
  isOpen: boolean;
  onClose: () => void;
}

type SimulationPhase = 'simulate' | 'results';

// =============================================
// MAIN COMPONENT
// =============================================

export const SimulationModal: React.FC<SimulationModalProps> = ({
  questionnaire,
  isOpen,
  onClose,
}) => {
  const [phase, setPhase] = useState<SimulationPhase>('simulate');
  const [scoringResult, setScoringResult] = useState<ScoringOutput | null>(null);

  // Handle simulation completion
  const handleComplete = (answers: SwipeAnswer[]) => {
    const result = calculateScores({
      questionnaire,
      answers,
    });
    setScoringResult(result);
    setPhase('results');
  };

  // Reset simulation
  const handleRestart = () => {
    setScoringResult(null);
    setPhase('simulate');
  };

  // Handle close
  const handleClose = () => {
    setScoringResult(null);
    setPhase('simulate');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 text-white">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} />
              <span className="text-sm font-medium">Chiudi</span>
            </button>

            <div className="flex items-center gap-2">
              <Play size={18} />
              <span className="text-sm font-medium">ANTEPRIMA</span>
              <span className="text-xs opacity-75">- {questionnaire.title}</span>
            </div>

            {phase === 'results' && (
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <RotateCcw size={16} />
                <span className="text-sm font-medium">Riprova</span>
              </button>
            )}

            {phase === 'simulate' && <div className="w-20" />}
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100vh-56px)] overflow-auto">
          {phase === 'simulate' ? (
            <SimulationRenderer
              questionnaire={questionnaire}
              onComplete={handleComplete}
              onBack={handleClose}
            />
          ) : (
            <DebugResultsView
              result={scoringResult}
              questionnaire={questionnaire}
              onRestart={handleRestart}
              onClose={handleClose}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// =============================================
// SIMULATION RENDERER
// =============================================

interface SimulationRendererProps {
  questionnaire: Questionnaire;
  onComplete: (answers: SwipeAnswer[]) => void;
  onBack: () => void;
}

const SimulationRenderer: React.FC<SimulationRendererProps> = ({
  questionnaire,
  onComplete,
  onBack,
}) => {
  const sections = questionnaire.sections || [];
  const totalQuestions = sections.reduce((acc, s) => acc + (s.questions?.length || 0), 0);

  // Check if there are questions
  if (totalQuestions === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Card padding="xl" className="max-w-md text-center">
          <div className="p-6 bg-amber-100 dark:bg-amber-900/30 rounded-2xl w-20 h-20 mx-auto flex items-center justify-center mb-4">
            <FileText size={32} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nessuna domanda</h3>
          <p className="text-muted-foreground mb-4">
            Aggiungi almeno una sezione con domande per testare il questionario.
          </p>
          <Button onClick={onBack} variant="outline">
            Torna all'editor
          </Button>
        </Card>
      </div>
    );
  }

  // Render based on UI style
  if (questionnaire.uiStyle === 'swipe') {
    return (
      <QuestionnaireSwipeRenderer
        sections={sections}
        onComplete={onComplete}
        onBack={onBack}
        showProgress={true}
        allowSkip={true}
      />
    );
  }

  // Fallback: Step-style renderer for 'step' and 'chat' styles
  return (
    <StepStyleRenderer
      questionnaire={questionnaire}
      onComplete={onComplete}
      onBack={onBack}
    />
  );
};

// =============================================
// STEP STYLE RENDERER (Fallback)
// =============================================

interface StepStyleRendererProps {
  questionnaire: Questionnaire;
  onComplete: (answers: SwipeAnswer[]) => void;
  onBack: () => void;
}

const StepStyleRenderer: React.FC<StepStyleRendererProps> = ({
  questionnaire,
  onComplete,
  onBack,
}) => {
  const sections = questionnaire.sections || [];
  const allQuestions = sections.flatMap(s => s.questions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<SwipeAnswer[]>([]);

  const currentQuestion = allQuestions[currentIndex];
  const progress = ((currentIndex + 1) / allQuestions.length) * 100;

  const handleAnswer = (answer: Partial<SwipeAnswer>) => {
    const newAnswer: SwipeAnswer = {
      questionId: currentQuestion.id,
      ...answer,
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    if (currentIndex === allQuestions.length - 1) {
      onComplete(newAnswers);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setAnswers(prev => prev.slice(0, -1));
    } else {
      onBack();
    }
  };

  if (!currentQuestion) return null;

  return (
    <div className="min-h-full flex flex-col">
      {/* Progress */}
      <div className="px-6 py-4 bg-muted/30">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Domanda {currentIndex + 1} di {allQuestions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          key={currentQuestion.id}
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card padding="xl">
            {/* Question Text */}
            <h2 className="text-xl md:text-2xl font-semibold text-foreground text-center mb-8">
              {currentQuestion.text}
            </h2>

            {/* Options */}
            {currentQuestion.type === 'likert' ? (
              <div className="space-y-3">
                {[
                  { value: 1, label: 'Per niente', emoji: '😞' },
                  { value: 2, label: 'Poco', emoji: '😕' },
                  { value: 3, label: 'Abbastanza', emoji: '😐' },
                  { value: 4, label: 'Molto', emoji: '🙂' },
                  { value: 5, label: 'Moltissimo', emoji: '😄' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer({ likertValue: opt.value })}
                    className="w-full p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4"
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-foreground font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {currentQuestion.options?.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer({ selectedOptionId: option.id })}
                    className="w-full p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4 text-left"
                  >
                    {option.icon && <span className="text-2xl">{option.icon}</span>}
                    <span className="text-foreground font-medium">{option.text}</span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 border-t border-border bg-muted/30">
        <div className="max-w-2xl mx-auto flex justify-between">
          <Button variant="ghost" onClick={handleBack}>
            Indietro
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleAnswer({})}
          >
            Salta
          </Button>
        </div>
      </div>
    </div>
  );
};

// =============================================
// DEBUG RESULTS VIEW
// =============================================

interface DebugResultsViewProps {
  result: ScoringOutput | null;
  questionnaire: Questionnaire;
  onRestart: () => void;
  onClose: () => void;
}

const DebugResultsView: React.FC<DebugResultsViewProps> = ({
  result,
  questionnaire,
  onRestart,
  onClose,
}) => {
  if (!result) return null;

  const { dimensionScores, profileCode, rawAnswers } = result;
  const sortedScores = [...dimensionScores].sort((a, b) => b.normalizedScore - a.normalizedScore);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 mb-4">
          <CheckCircle2 size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Debug Risultati Simulazione
        </h1>
        <p className="text-muted-foreground">
          Questionario: <span className="font-medium text-foreground">{questionnaire.title}</span>
        </p>
      </motion.div>

      {/* Profile Code */}
      {profileCode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card padding="lg" className="text-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200/50 dark:border-indigo-800/30">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Target size={24} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-foreground">Profilo Calcolato</h2>
            </div>
            <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              {profileCode}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Basato sulle {sortedScores.filter(s => s.normalizedScore > 0).length} dimensioni con punteggio maggiore
            </p>
          </Card>
        </motion.div>
      )}

      {/* Dimension Scores */}
      {dimensionScores.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <BarChart3 size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Punteggi per Dimensione</h2>
            </div>

            <div className="space-y-4">
              {sortedScores.map((score, idx) => (
                <motion.div
                  key={score.dimensionId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full ring-2 ring-white dark:ring-gray-800"
                        style={{ backgroundColor: score.color || '#6366f1' }}
                      />
                      <span className="font-medium text-foreground">
                        {score.code}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {score.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Raw: {score.rawScore.toFixed(1)}/{score.maxPossibleScore.toFixed(1)}
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: score.color || '#6366f1' }}
                      >
                        {score.normalizedScore}%
                      </span>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: score.color || '#6366f1' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${score.normalizedScore}%` }}
                      transition={{ delay: 0.4 + idx * 0.05, duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              ))}

              {dimensionScores.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nessuna dimensione di scoring configurata
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Raw Answers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <FileText size={20} className="text-teal-600 dark:text-teal-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Risposte ({rawAnswers.length})
            </h2>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {rawAnswers.map((answer, idx) => (
              <motion.div
                key={answer.questionId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.02 }}
                className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-gray-800/50 rounded-lg"
              >
                <span className="flex items-center justify-center w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {answer.questionText}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    → <span className={`font-medium ${
                      answer.type === 'skipped' ? 'text-amber-600' : 'text-teal-600 dark:text-teal-400'
                    }`}>
                      {answer.answer}
                    </span>
                    {answer.type === 'likert' && (
                      <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                        Likert
                      </span>
                    )}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center gap-4 pb-8"
      >
        <Button
          onClick={onRestart}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <RotateCcw size={18} />
          Ripeti Simulazione
        </Button>
        <Button
          onClick={onClose}
          size="lg"
          className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
        >
          Chiudi Anteprima
        </Button>
      </motion.div>
    </div>
  );
};

export default SimulationModal;
