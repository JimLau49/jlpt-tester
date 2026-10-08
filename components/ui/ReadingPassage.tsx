import React from 'react';
import { formatPassageHtml } from '@/lib/utils/passage-format';

type ReadingPassageProps = {
  title?: string;
  content: string | React.ReactNode;
};

export function ReadingPassage({ title, content }: ReadingPassageProps) {
  return (
    <div className="bg-surface-muted/60 px-4 py-5 md:px-10 md:py-9 rounded-lg border border-border-soft lg:max-h-[85vh] lg:overflow-y-auto">
      {title && (
        <h3 className="text-lg font-bold text-center mb-5 text-foreground border-b border-border-soft pb-3">{title}</h3>
      )}
      {typeof content === 'string' ? (
        <div className="passage text-foreground/90" dangerouslySetInnerHTML={{ __html: formatPassageHtml(content) }} />
      ) : (
        <div className="passage text-foreground/90">{content}</div>
      )}
    </div>
  );
}
