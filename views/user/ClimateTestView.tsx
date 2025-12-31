import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { User, ClimateData } from '../../types';
import { CLIMATE_SURVEY } from '../../data/climateContent';
import { StepProgressBar } from '../../components/StepProgressBar';

interface ClimateTestViewProps {
  user: User;
  onComplete: (data: ClimateData) => void;
}

export const ClimateTestView: React.FC<ClimateTestViewProps> = ({ user, onComplete }) => {
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});

    const section = CLIMATE_SURVEY[currentSectionIndex];
    const isLastSection = currentSectionIndex === CLIMATE_SURVEY.length - 1;

    const handleAnswer = (questionId: string, score: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: score }));
    };

    const handleNext = () => {
        // Validate current section
        const missing = section.questions.some(q => !answers[q.id]);
        if (missing) {
            alert("Per favore, rispondi a tutte le domande della sezione prima di procedere.");
            return;
        }

        if (isLastSection) {
            // Calculate Scores
            const sectionAverages: Record<string, number> = {};
            let totalSum = 0;
            let totalQuestions = 0;

            CLIMATE_SURVEY.forEach(s => {
                let sectionSum = 0;
                s.questions.forEach(q => {
                    sectionSum += answers[q.id] || 0;
                });
                const avg = sectionSum / s.questions.length;
                sectionAverages[s.title] = avg;
                totalSum += sectionSum;
                totalQuestions += s.questions.length;
            });

            const overallAverage = totalSum / totalQuestions;

            const finalData: ClimateData = {
                rawScores: answers,
                sectionAverages,
                overallAverage,
                submissionDate: new Date().toISOString()
            };
            
            onComplete(finalData);
        } else {
            setCurrentSectionIndex(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const getProgress = () => ((currentSectionIndex + 1) / CLIMATE_SURVEY.length) * 100;

    return (
        <div className="max-w-3xl mx-auto p-6 pb-20">
             {/* Step Progress Bar */}
             <StepProgressBar currentStep="climate" completedSteps={['riasec']} />

             <div className="mb-8">
                <h1 className="text-3xl font-brand font-bold text-center mb-2">Analisi Clima Aziendale</h1>
                <p className="text-center text-gray-500 mb-6">Misura la qualità della tua esperienza lavorativa attuale.</p>
                
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-jnana-sage transition-all duration-500 ease-out" style={{ width: `${getProgress()}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium uppercase tracking-wider">
                    <span>Sezione {currentSectionIndex + 1} di {CLIMATE_SURVEY.length}</span>
                    <span>{Math.round(getProgress())}%</span>
                </div>
             </div>

             <Card className="mb-8 animate-fade-in" padding="lg">
                 <h2 className="text-2xl font-brand font-bold mb-6 text-gray-800 dark:text-gray-100 border-b pb-4 dark:border-gray-700">
                     {section.title}
                 </h2>
                 
                 <div className="space-y-8">
                     {section.questions.map(q => (
                         <div key={q.id} className="space-y-3">
                             <p className="font-medium text-gray-700 dark:text-gray-200 text-lg">{q.text}</p>
                             <div className="flex justify-between items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                                 {[1, 2, 3, 4, 5].map(score => (
                                     <button
                                         key={score}
                                         onClick={() => handleAnswer(q.id, score)}
                                         className={`flex-1 h-12 rounded-lg font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center ${
                                             answers[q.id] === score
                                             ? score < 3 ? 'bg-red-500 text-white shadow-md' : score === 3 ? 'bg-yellow-400 text-white shadow-md' : 'bg-green-500 text-white shadow-md'
                                             : 'bg-white dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                         }`}
                                     >
                                         {score}
                                     </button>
                                 ))}
                             </div>
                             <div className="flex justify-between text-xs text-gray-400 uppercase font-bold px-1">
                                 <span>In disaccordo</span>
                                 <span>D'accordo</span>
                             </div>
                         </div>
                     ))}
                 </div>

                 <div className="mt-12 flex justify-end">
                     <Button onClick={handleNext} size="lg" className="shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white">
                         {isLastSection ? 'Concludi Sondaggio' : 'Prosegui'} <ArrowRight className="ml-2" size={20} />
                     </Button>
                 </div>
             </Card>
        </div>
    );
};