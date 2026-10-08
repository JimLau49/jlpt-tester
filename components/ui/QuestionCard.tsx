import React from 'react';
import { parseFormattedText } from '@/lib/utils/text-parser';

type Choice = {
  id: string | number;
  text: string;
  imageUrl?: string;
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
  // On a phone, short answers (readings, particles) sit two per row; anything longer gets its own row.
  const longestChoice = Math.max(0, ...choices.map((c) => (c.imageUrl ? Infinity : c.text.replace(/<[^>]+>/g, '').length)));
  const gridColumns = longestChoice <= 6 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className="w-full border-b border-border-soft pb-4 mb-4 md:pb-6 md:mb-6 last:border-0 last:mb-0 last:pb-0">
        {/* Instruction Section - Compact Header */}
        {/* Instruction Section - Compact Header */}
        {instruction && (
            (instruction.includes('[Script]') || instruction.includes('[Transcript]')) ? (
                isSubmitted && (
                    <details className="mb-4 group">
                        <summary className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 list-none flex items-center gap-2 select-none">
                             <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            Show Listening Transcript
                        </summary>
                        <div className="mt-2 p-4 bg-surface-muted rounded-lg text-base text-foreground/85 leading-relaxed border border-border-soft space-y-2 jp-text">
                            {instruction.replace(/\[(Script|Transcript)\]/g, '').trim().split('\n').map((line, i) => {
                                const trimmed = line.trim();
                                if (!trimmed) return null;
                                
                                // Styling for Reference / Context
                                if (trimmed.startsWith('Reference:')) {
                                     return (
                                        <div key={i} className="text-text-muted italic pb-2 mb-2 border-b border-border-soft">
                                            {parseFormattedText(trimmed)}
                                        </div>
                                    );
                                }
                                
                                // Speaker styling (e.g. "Man:", "女:", "A:")
                                // We look for a short prefix followed by a colon
                                const speakerMatch = trimmed.match(/^([^:：]{1,10})[:：](.+)$/);
                                if (speakerMatch) {
                                    const speaker = speakerMatch[1];
                                    const content = speakerMatch[2];
                                    return (
                                        <div key={i} className="flex flex-col sm:flex-row gap-1 sm:gap-3">
                                            <span className="font-bold text-foreground min-w-[3rem] shrink-0 sm:text-right">{speaker}:</span>
                                            <span>{parseFormattedText(content)}</span>
                                        </div>
                                    );
                                }

                                return <div key={i}>{parseFormattedText(trimmed)}</div>;
                            })}
                        </div>
                    </details>
                )
            ) : (
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 px-3 py-2 text-sm font-medium mb-2 rounded-sm">
                    {parseFormattedText(instruction)}
                </div>
            )
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
        <div className="bg-surface-muted px-3 md:px-4 py-2.5 md:py-3 rounded flex items-baseline gap-2 md:gap-3">
             {questionNumber && (
                <span className="font-bold text-foreground select-none">
                    {questionNumber}.
                </span>
            )}
            <div className="text-base md:text-lg font-medium text-foreground leading-relaxed jp-text min-w-0">
                {parseFormattedText(questionText)}
            </div>
        </div>

        {/* Choices Container */}
        <div className={`mt-2 ${layout === 'grid' ? `grid ${gridColumns} lg:grid-cols-4 gap-x-2 gap-y-0.5 sm:gap-4` : 'flex flex-col gap-1 md:gap-3'}`}>
            {choices.map((choice, index) => {
                const isSelected = selectedChoiceId === choice.id;
                const isCorrect = correctChoiceId === choice.id;
                const choiceLabel = index + 1; 

                // Determine feedback styles
                let feedbackTextPrefix = null;
                let textClass = 'text-foreground/90';
                let indicatorClass = 'border-border-soft bg-surface group-hover:border-blue-400';
                
                if (isSubmitted) {
                    const userMissedQuestion = !selectedChoiceId;

                    if (isCorrect) {
                         if (userMissedQuestion) {
                             feedbackTextPrefix = <span className="font-bold text-red-600 dark:text-red-400 mr-2">正解 (未回答):</span>;
                             textClass = 'text-red-600 dark:text-red-400 font-bold';
                             indicatorClass = 'bg-red-500 border-red-500 text-white';
                         } else {
                             feedbackTextPrefix = <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">正解:</span>;
                             textClass = 'text-blue-600 dark:text-blue-400 font-bold';
                             indicatorClass = 'bg-blue-500 border-blue-500 text-white'; 
                         }
                    } else if (isSelected && !isCorrect) {
                        feedbackTextPrefix = <span className="font-bold text-red-600 dark:text-red-400 mr-2">不正解:</span>;
                        textClass = 'text-red-600 dark:text-red-400 font-bold';
                        indicatorClass = 'bg-blue-500 border-blue-500'; 
                    } else {
                        textClass = 'text-text-muted/70';
                        indicatorClass = 'border-border-soft bg-surface-muted';
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
                    className="group flex items-start gap-2 sm:gap-3 py-2 sm:py-2.5 pl-3 pr-1 sm:px-2 text-left rounded hover:bg-surface-muted/60 transition-colors disabled:cursor-default"
                >   
                    {/* Fixed Width Label Container for Hanging Indent */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 mt-0.5">
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
                             <span className={`text-base font-medium select-none ${isSubmitted ? 'text-text-muted/60' : 'text-text-muted'}`}>
                                {choiceLabel})
                            </span>
                        )}
                    </div>

                    <span className={`text-base leading-relaxed jp-text ${textClass} flex-1`}>
                        {feedbackTextPrefix}
                        {feedbackTextPrefix && <span className="text-inherit text-base mr-1">{choiceLabel})</span>}
                        {choice.imageUrl ? (
                             <img
                                src={choice.imageUrl}
                                alt={`Choice ${choiceLabel}`}
                                className="max-w-[200px] max-h-[150px] object-contain rounded border border-border-soft bg-surface"
                            />
                        ) : (
                             parseFormattedText(choice.text)
                        )}
                    </span>
                </button>
                );
            })}
        </div>
      </div>
    </div>
  );
}
