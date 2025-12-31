import React, { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { User, RiasecScore, ChecklistSection, ForcedChoiceSection } from '../../types';
import { RIASEC_SECTIONS } from '../../constants';
import { calculateScore } from '../../services/riasecService';
import { StepProgressBar } from '../../components/StepProgressBar';

interface UserTestViewProps {
  user: User;
  onComplete: (score: RiasecScore) => void;
}

export const UserTestView: React.FC<UserTestViewProps> = ({ user, onComplete }) => {
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [answers, setAnswers] = useState<Set<string>>(new Set());

    const section = RIASEC_SECTIONS[currentSectionIndex];
    const isLastSection = currentSectionIndex === RIASEC_SECTIONS.length - 1;

    const toggleAnswer = (id: string, section: ChecklistSection | ForcedChoiceSection) => {
        const newAnswers = new Set(answers);
        
        if (section.type === 'forced_choice') {
             // For forced choice, we need to remove the OTHER option of the pair if selected
             // Find the question this option belongs to
             const question = (section as ForcedChoiceSection).questions.find(q => q.options.some(o => o.id === id));
             if (question) {
                 question.options.forEach(opt => newAnswers.delete(opt.id));
             }
             newAnswers.add(id);
        } else {
             // Checklist logic
             if (newAnswers.has(id)) {
                 newAnswers.delete(id);
             } else {
                 if (section.maxSelection) {
                     // Count items selected for this specific section
                     const currentSelectedCount = section.items.filter(i => newAnswers.has(i.id)).length;
                     if (currentSelectedCount < section.maxSelection) {
                         newAnswers.add(id);
                     }
                 } else {
                     newAnswers.add(id);
                 }
             }
        }
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (isLastSection) {
            const score = calculateScore(answers);
            onComplete(score);
        } else {
            setCurrentSectionIndex(prev => prev + 1);
            window.scrollTo(0,0);
        }
    };

    const getProgress = () => ((currentSectionIndex + 1) / RIASEC_SECTIONS.length) * 100;

    return (
        <div className="max-w-3xl mx-auto p-6 pb-20">
             {/* Step Progress Bar */}
             <StepProgressBar currentStep="riasec" completedSteps={[]} />

             <div className="mb-8">
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-jnana-sage transition-all duration-500 ease-out" style={{ width: `${getProgress()}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium uppercase tracking-wider">
                    <span>Sezione {currentSectionIndex + 1} di {RIASEC_SECTIONS.length}</span>
                    <span>{Math.round(getProgress())}% Completato</span>
                </div>
             </div>

             <Card className="mb-8 animate-fade-in" padding="lg">
                 <h2 className="text-2xl font-brand font-bold mb-4 text-jnana-text dark:text-gray-100">{section.title}</h2>
                 <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">{section.description}</p>
                 
                 <div className="space-y-6">
                     {section.type === 'forced_choice' && (
                         section.questions.map((q) => (
                             <div key={q.id} className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-jnana-sage/30 transition-colors">
                                 <h4 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">{q.text}</h4>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                     {q.options.map(opt => (
                                         <button
                                             key={opt.id}
                                             onClick={() => toggleAnswer(opt.id, section)}
                                             className={`p-4 rounded-xl text-left transition-all duration-200 border-2 ${
                                                 answers.has(opt.id)
                                                 ? 'border-jnana-sage bg-jnana-sage/10 text-jnana-sage font-bold shadow-sm'
                                                 : 'border-transparent bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                             }`}
                                         >
                                             {opt.text}
                                         </button>
                                     ))}
                                 </div>
                             </div>
                         ))
                     )}

                     {section.type === 'checklist' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             {section.items.map(item => (
                                 <button
                                     key={item.id}
                                     onClick={() => toggleAnswer(item.id, section)}
                                     className={`p-4 rounded-xl text-left transition-all duration-200 border-2 flex items-start gap-3 ${
                                         answers.has(item.id)
                                         ? 'border-jnana-sage bg-jnana-sage/10 text-jnana-sage font-bold shadow-sm'
                                         : 'border-transparent bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-100 dark:border-gray-700'
                                     }`}
                                 >
                                     <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                                         answers.has(item.id) ? 'bg-jnana-sage border-jnana-sage text-white' : 'border-gray-300'
                                     }`}>
                                         {answers.has(item.id) && <Check size={12} strokeWidth={4} />}
                                     </div>
                                     {item.text}
                                 </button>
                             ))}
                         </div>
                     )}
                 </div>

                 <div className="mt-10 flex justify-end">
                     <Button onClick={handleNext} size="lg" className="shadow-lg shadow-jnana-sage/20">
                         {isLastSection ? 'Concludi Test' : 'Prosegui'} <ArrowRight className="ml-2" size={20} />
                     </Button>
                 </div>
             </Card>
        </div>
    );
};