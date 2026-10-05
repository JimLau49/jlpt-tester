import React from 'react';
import { parseFormattedText } from '@/lib/utils/text-parser';

type ReadingPassageProps = {
  title?: string;
  content: string | React.ReactNode; 
};

export function ReadingPassage({ title, content }: ReadingPassageProps) {
  return (
    <div className="bg-surface-muted/60 p-6 md:p-8 rounded-lg border border-border-soft max-h-[85vh] overflow-y-auto">
      {title && (
        <h3 className="text-lg font-bold text-center mb-5 text-foreground border-b border-border-soft pb-3">{title}</h3>
      )}
      <div className="prose prose-base dark:prose-invert max-w-[65ch] mx-auto text-foreground/90 leading-[1.9] jp-text">
        {typeof content === 'string' ? (
             // Heuristic: If it looks like HTML, render as HTML. Otherwise parse as formatted text.
             (content.trim().startsWith('<')) ? (
                 <div dangerouslySetInnerHTML={{ __html: content }} />
             ) : (
                 <div className="whitespace-pre-wrap">{parseFormattedText(content)}</div>
             )
        ) : (
            content
        )}
      </div>
    </div>
  );
}
