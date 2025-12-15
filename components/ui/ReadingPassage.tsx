import React from 'react';
import { parseFormattedText } from '@/lib/utils/text-parser';

type ReadingPassageProps = {
  title?: string;
  content: string | React.ReactNode; 
};

export function ReadingPassage({ title, content }: ReadingPassageProps) {
  return (
    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-lg border border-blue-100 dark:border-blue-900/20 max-h-[85vh] overflow-y-auto">
      {title && (
        <h3 className="text-base font-bold text-center mb-4 text-zinc-900 dark:text-zinc-100 border-b border-blue-200 dark:border-blue-800 pb-2">{title}</h3>
      )}
      <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-300 leading-relaxed">
        {typeof content === 'string' ? (
             <div className="whitespace-pre-wrap">{parseFormattedText(content)}</div>
        ) : (
            content
        )}
      </div>
    </div>
  );
}
