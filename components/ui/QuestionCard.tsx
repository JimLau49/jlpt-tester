import React from 'react';
import { parseFormattedText } from '@/lib/utils/text-parser';

type Choice = {
  id: string | number;
  text: string;
};

type QuestionCardProps = {
  instruction?: string;
  questionNumber?: number;
  questionText: string;
  choices: Choice[];
  selectedChoiceId?: string | number | null;
  correctChoiceId?: string | number; 
  isSubmitted?: boolean; 
  onSelectChoice: (id: string | number) => void;
  audioUrl?: string; 
  layout?: 'grid' | 'stack'; // Control layout mode
};

export function QuestionCard({
  instruction,
  questionNumber,
  questionText,
  choices,
  selectedChoiceId,
  correctChoiceId,
  isSubmitted = false,
  onSelectChoice,
  audioUrl,
  layout = 'grid' // Default to grid (good for short vocab)
}: QuestionCardProps) {
  return (
    <div className="w-full border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-6 last:border-0 last:mb-0 last:pb-0">
        {/* Instruction Section - Compact Header */}
        {instruction && (
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 px-3 py-2 text-sm font-medium mb-2 rounded-sm">
                {instruction}
            </div>
        )}

      <div className="flex flex-col gap-2">
        {/* Audio Section (Compact) */}
        {audioUrl && (
            <div className="mb-2">
                <audio controls className="h-8 w-full max-w-[200px]">
                    <source src={audioUrl} type="audio/mpeg" />
                </audio>
            </div>
        )}

        {/* Question Text Bar */}
        <div className="bg-zinc-100 dark:bg-zinc-800/50 px-3 py-2 rounded-sm flex items-baseline gap-3">
             {questionNumber && (
                <span className="font-bold text-zinc-900 dark:text-zinc-100 select-none">
                    {questionNumber}.
                </span>
            )}
            <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100 leading-normal">
                {parseFormattedText(questionText)}
            </h2>
        </div>

        {/* Choices Container */}
        <div className={`mt-2 ${layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' : 'flex flex-col gap-3'}`}>
            {choices.map((choice, index) => {
                const isSelected = selectedChoiceId === choice.id;
                const isCorrect = correctChoiceId === choice.id;
                const choiceLabel = index + 1; 

                // Determine feedback styles
                let feedbackTextPrefix = null;
                let textClass = 'text-zinc-800 dark:text-zinc-300';
                let indicatorClass = 'border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-900 group-hover:border-blue-400';
                
                if (isSubmitted) {
                    if (isCorrect) {
                         feedbackTextPrefix = <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">正解:</span>;
                         textClass = 'text-blue-600 dark:text-blue-400 font-bold';
                         indicatorClass = 'bg-blue-500 border-blue-500 text-white'; 
                    } else if (isSelected && !isCorrect) {
                        feedbackTextPrefix = <span className="font-bold text-red-600 dark:text-red-400 mr-2">不正解:</span>;
                        textClass = 'text-red-600 dark:text-red-400 font-bold';
                        indicatorClass = 'bg-blue-500 border-blue-500'; 
                    } else {
                        textClass = 'text-zinc-400 dark:text-zinc-600';
                        indicatorClass = 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800';
                    }
                } else if (isSelected) {
                     textClass = 'text-blue-700 dark:text-blue-300 font-semibold';
                     indicatorClass = 'bg-blue-500 border-blue-500 shadow-sm';
                }
                
                return (
                <button
                    key={choice.id}
                    onClick={() => !isSubmitted && onSelectChoice(choice.id)}
                    disabled={isSubmitted}
                    className="group flex items-start gap-3 py-2 px-2 text-left rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors disabled:cursor-default"
                >   
                    {/* Fixed Width Label Container for Hanging Indent */}
                    <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                        {/* Radio Circle */}
                        <div 
                            className={`
                            w-4 h-4 rounded-full border flex items-center justify-center transition-colors
                            ${indicatorClass}
                            `}
                        >
                             {(isSelected || (isSubmitted && isCorrect)) && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        
                        {!feedbackTextPrefix && (
                             <span className={`text-sm font-medium select-none ${isSubmitted ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                {choiceLabel})
                            </span>
                        )}
                    </div>

                    <span className={`text-sm leading-relaxed ${textClass} flex-1`}>
                        {feedbackTextPrefix}
                        {feedbackTextPrefix && <span className="text-inherit text-sm mr-1">{choiceLabel})</span>}
                        {parseFormattedText(choice.text)}
                    </span>
                </button>
                );
            })}
        </div>
      </div>
    </div>
  );
}
