"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { QuestionCard } from "@/components/ui/QuestionCard";
import { ReadingPassage } from "@/components/ui/ReadingPassage";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Modal } from "@/components/ui/Modal";

export type Choice = {
  id: number;
  text: string;
  imageUrl?: string;
};

export type Question = {
  id: number;
  number: number;
  text: string;
  instruction?: string;
  choices: Choice[];
  correctChoiceId: number;
  audioUrl?: string;
};

export type SectionData = {
  id: number;
  type: 'vocab' | 'reading' | 'listening';
  title: string;
  passageTitle?: string;
  passageContent?: string;
  questions: Question[];
};

export type QuizData = {
  id: number;
  level: string;
  year: number;
  session: string;
  sections: SectionData[];
};

type QuizRunnerProps = {
  data: QuizData;
};
  
export default function QuizRunner({ data }: QuizRunnerProps) {
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [submittedSections, setSubmittedSections] = useState<Set<string>>(new Set());
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [currentSection, setCurrentSection] = useState<'vocab' | 'reading' | 'listening'>('vocab');
  
  // Timer State (Count up)
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Group Sections for Display Logic
  // Page 1 (Vocab): All 'vocab' sections + The FIRST 'reading' section (Problem 7)
  // Page 2 (Reading): All OTHER 'reading' sections
  // Page 3 (Listening): All 'listening' sections

  const vocabSections = data.sections.filter(s => s.type === 'vocab');
  const readingSections = data.sections.filter(s => s.type === 'reading');
  const listeningSections = data.sections.filter(s => s.type === 'listening');
  // Problem 7 is technically a Reading section in JSON but belongs to Vocab/Grammar
  const firstReadingSection = readingSections.length > 0 ? readingSections[0] : null;
  const remainingReadingSections = readingSections.length > 1 ? readingSections.slice(1) : [];

  const isAllSubmitted = submittedSections.has('vocab') && submittedSections.has('reading') && submittedSections.has('listening');

  // Pause the timer as soon as the section you're currently viewing has been
  // checked. It resumes if you reset that section or navigate to a section that
  // hasn't been checked yet. (This also covers the all-submitted case, since the
  // current section is necessarily checked by then.)
  const isTimerPaused = submittedSections.has(currentSection);

  useEffect(() => {
    if (isTimerPaused) return;

    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerPaused]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Helper to flatten questions for scoring
  const allQuestions = data.sections.flatMap(s => s.questions);

  const handleSelect = (questionId: number, choiceId: string | number) => {
    // Prevent changing answer if THAT section is submitted
    // We need to know the section of the question. 
    // Expensive lookup? Or just derive it.
    // For prototype, strict check might be hard without map. 
    // Let's just check if current visible section is submitted? 
    // Actually, we can check if the question belongs to a submitted section.
    const section = data.sections.find(s => s.questions.some(q => q.id === questionId));
    if (section) {
        // Special Case: Problem 7 (First Reading Section) counts as 'vocab' submission
        if (section.id === firstReadingSection?.id) {
             if (submittedSections.has('vocab')) return;
        } else if (submittedSections.has(section.type)) {
             return;
        }
    } 
    
    setAnswers(prev => ({ ...prev, [questionId]: choiceId }));
  };

  const calculateScore = (sectionFilter?: string) => {
    let score = 0;
    let total = 0;
    
    // Helper to check
    const check = (q: Question) => {
        // Find section for this question
        const section = data.sections.find(s => s.questions.some(subQ => subQ.id === q.id));
        
        if (section) {
            // Determine "Effective Type" for scoring
            // Problem 7 (isReading && isFirst) -> 'vocab'
            let effectiveType = section.type;
            if (section.id === firstReadingSection?.id) {
                effectiveType = 'vocab';
            }

            // Apply filter if provided
            if (sectionFilter && effectiveType !== sectionFilter) return;

            // Only count if submitted (or valid for scoring)
            if (submittedSections.has(effectiveType)) {
                 if (answers[q.id] === q.correctChoiceId) score++;
                 total++;
            }
        }
    };

    allQuestions.forEach(check);
    
    return { score, total };
  };

  const handleSectionSubmit = (sectionType: string) => {
    setSubmittedSections(prev => new Set(prev).add(sectionType));
    // If it's the last one, maybe show modal?
    const newSet = new Set(submittedSections).add(sectionType);
    if (newSet.has('vocab') && newSet.has('reading') && newSet.has('listening')) {
       setShowScoreModal(true);
    }
  };

  // Un-check a section so the user can keep editing. Selected answers are kept;
  // only the locked/revealed state is cleared. The timer resumes automatically
  // since isAllSubmitted becomes false.
  const handleSectionReset = (sectionType: string) => {
    setSubmittedSections(prev => {
      const next = new Set(prev);
      next.delete(sectionType);
      return next;
    });
    setShowScoreModal(false);
  };

  // Global score for Modal
  const { score: globalScore, total: globalTotal } = calculateScore();
  const percentage = globalTotal > 0 ? Math.round((globalScore / globalTotal) * 100) : 0;

  // Section score for Header
  const { score: sectionScore, total: sectionTotal } = calculateScore(currentSection);

  return (
    <div className="min-h-screen bg-background font-sans transition-colors duration-300">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/85 backdrop-blur-md border-b border-border-soft h-16 flex items-center justify-between px-6 md:px-12">
        <Link href="/" className="font-bold text-xl tracking-tight flex items-center gap-3 hover:opacity-80 transition-opacity">
             JLPT Tester 
             <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-100">
                {data.level} {data.session} {data.year}
             </span>
             
             {/* Simple Breadcrumb/Indicator */}
             <div className="hidden md:flex items-center gap-2 ml-4 text-sm font-medium">
                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        setCurrentSection('vocab');
                        window.scrollTo({ top: 0, behavior: 'auto' });
                    }}
                    className={`px-3 py-1 rounded text-xs transition-colors hover:bg-surface-muted ${currentSection === 'vocab' ? 'bg-surface-muted text-foreground font-semibold' : 'text-text-muted'}`}
                >
                    Vocabulary
                </button>
                <span className="text-text-muted/50">/</span>
                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        setCurrentSection('reading');
                        window.scrollTo({ top: 0, behavior: 'auto' });
                    }}
                    className={`px-3 py-1 rounded text-xs transition-colors hover:bg-surface-muted ${currentSection === 'reading' ? 'bg-surface-muted text-foreground font-semibold' : 'text-text-muted'}`}
                >
                    Reading
                </button>
                <span className="text-text-muted/50">/</span>
                <button 
                    onClick={(e) => {
                         e.preventDefault();
                         setCurrentSection('listening');
                         window.scrollTo({ top: 0, behavior: 'auto' });
                    }}
                    className={`px-3 py-1 rounded text-xs transition-colors hover:bg-surface-muted ${currentSection === 'listening' ? 'bg-surface-muted text-foreground font-semibold' : 'text-text-muted'}`}
                >
                    Listening
                </button>
             </div>
        </Link>
        <div className="flex items-center gap-4">
            {!isAllSubmitted && (
                <span className="text-sm font-medium text-text-muted hidden md:block">
                    Time Elapsed: {formatTime(timeElapsed)}
                    {isTimerPaused && <span className="ml-1 text-amber-600 dark:text-amber-400">(paused)</span>}
                </span>
            )}
            {submittedSections.has(currentSection) && <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{currentSection.charAt(0).toUpperCase() + currentSection.slice(1)} Score: {sectionScore}/{sectionTotal}</span>}
            
            {/* Show global finish only if all done? Or just hide it and rely on section buttons? 
                Let's keep a 'Review' button if all done. */}
            {/* Dynamic Header Button based on Section State */}
            {submittedSections.has(currentSection) ? (
                <button
                    onClick={() => handleSectionReset(currentSection)}
                    title="Un-check this section so you can keep editing your answers"
                    className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-amber-200 dark:border-amber-800"
                >
                    Reset {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}
                    <span aria-hidden="true">↺</span>
                </button>
            ) : (
                <button
                    onClick={() => handleSectionSubmit(currentSection)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                   Check {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}
                </button>
            )}
            {isAllSubmitted && (
               <button
                    onClick={() => setShowScoreModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    Review Final Results
                </button>
            )}
            <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-20 pb-20 max-w-7xl mx-auto px-4 md:px-6 space-y-12">
        
        {/* Section 1: Vocabulary + First Reading */}
        {currentSection === 'vocab' && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Vocab Sections */}
            {vocabSections.map(section => (
                <section key={section.id} className="bg-surface p-4 md:p-6 rounded-lg shadow-sm border border-border-soft">
                    <div className="mb-4 pb-2 border-b border-border-soft flex justify-between items-end">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
                            {section.questions.length > 0 && 
                                <p className="text-xs text-text-muted">
                                    Questions {section.questions[0].number} - {section.questions[section.questions.length-1].number}
                                </p>
                            }
                        </div>
                    </div>
                    
                    <div className="flex flex-col">
                        {section.questions.map((q) => (
                            <QuestionCard 
                                key={q.id}
                                instruction={q.instruction || undefined} 
                                questionNumber={q.number}
                                questionText={q.text}
                                choices={q.choices}
                                correctChoiceId={q.correctChoiceId} 
                                isSubmitted={submittedSections.has('vocab')} 
                                selectedChoiceId={answers[q.id]}
                                onSelectChoice={(cid) => handleSelect(q.id, cid)}
                                layout="grid" 
                            />
                        ))}
                    </div>
                </section>
            ))}

            {/* First Reading Section (Problem 7) */}
            {firstReadingSection && (
                <section className="bg-surface p-4 md:p-6 rounded-lg shadow-sm border border-border-soft">
                    <div className="mb-4 pb-2 border-b border-border-soft">
                        <h2 className="text-lg font-bold text-foreground">{firstReadingSection.passageTitle || firstReadingSection.title}</h2>
                        {firstReadingSection.questions.length > 0 && 
                            <p className="text-xs text-text-muted">
                                Questions {firstReadingSection.questions[0].number} - {firstReadingSection.questions[firstReadingSection.questions.length-1].number}
                            </p>
                        }
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6 items-start relative">
                        <div className="lg:w-1/2 lg:sticky lg:top-20 self-start">
                            {firstReadingSection.passageContent && (
                                <ReadingPassage 
                                    title={firstReadingSection.passageTitle}
                                    content={firstReadingSection.passageContent} // Pass string directly
                                />
                            )}
                        </div>
                        <div className="lg:w-1/2 flex flex-col gap-1">
                            {firstReadingSection.questions.map((q) => (
                                <QuestionCard 
                                    key={q.id}
                                    questionNumber={q.number}
                                    questionText={q.text}
                                    choices={q.choices}
                                    correctChoiceId={q.correctChoiceId}
                                    isSubmitted={submittedSections.has('vocab')} // Problem 7 counts as Vocab submission
                                    selectedChoiceId={answers[q.id]}
                                    onSelectChoice={(cid) => handleSelect(q.id, cid)}
                                    layout="stack" 
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <div className="flex justify-center border-t border-border-soft pt-6 gap-4">
                 {/* Vocab Check Button */}
                <button
                    onClick={() => submittedSections.has('vocab') ? handleSectionReset('vocab') : handleSectionSubmit('vocab')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${
                        submittedSections.has('vocab')
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {submittedSections.has('vocab') ? 'Reset Vocab ↺' : 'Check Vocab Answers'}
                </button>

                <button 
                    onClick={() => {
                        setCurrentSection('reading');
                        window.scrollTo({ top: 0, behavior: 'auto' });
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-surface-muted hover:opacity-85 rounded-full text-foreground font-medium transition-colors"
                >
                    Next Section: Reading (Part 2)
                    <span aria-hidden="true">&rarr;</span>
                </button>
            </div>
        </div>
        )}

         {/* Section 2: Reading Comprehension (Remaining Parts) */}
         {currentSection === 'reading' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {remainingReadingSections.map(section => (
                    <section key={section.id} className="bg-surface p-4 md:p-6 rounded-lg shadow-sm border border-border-soft">
                        <div className="mb-4 pb-2 border-b border-border-soft">
                            <h2 className="text-lg font-bold text-foreground">{section.passageTitle || section.title}</h2>
                            {section.questions.length > 0 && 
                                <p className="text-xs text-text-muted">
                                    Questions {section.questions[0].number} - {section.questions[section.questions.length-1].number}
                                </p>
                            }
                        </div>

                        <div className="flex flex-col lg:flex-row gap-6 items-start relative">
                            {/* Passage Column - Sticky & Wide for this type */}
                            <div className="lg:w-3/5 lg:sticky lg:top-20 self-start">
                                {section.passageContent && (
                                    <ReadingPassage 
                                        content={section.passageContent} // Pass string directly
                                    />
                                )}
                            </div>

                            {/* Questions Column */}
                            <div className="lg:w-2/5 flex flex-col gap-1">
                                {section.questions.map((q) => (
                                    <QuestionCard 
                                        key={q.id}
                                        questionNumber={q.number}
                                        questionText={q.text}
                                        choices={q.choices}
                                        correctChoiceId={q.correctChoiceId}
                                        isSubmitted={submittedSections.has('reading')}
                                        selectedChoiceId={answers[q.id]}
                                        onSelectChoice={(cid) => handleSelect(q.id, cid)}
                                        layout="stack" 
                                    />
                                ))}
                            </div>
                        </div>
                    </section>
                ))}

                <div className="flex justify-center border-t border-border-soft pt-6 gap-4">
                     <button 
                        onClick={() => setCurrentSection('vocab')}
                        className="flex items-center gap-2 px-6 py-3 text-text-muted hover:bg-surface-muted rounded-full font-medium transition-colors"
                    >
                        &larr; Previous Section
                    </button>
                    
                    {/* Reading Check Button */}
                    <button
                        onClick={() => submittedSections.has('reading') ? handleSectionReset('reading') : handleSectionSubmit('reading')}
                         className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${
                            submittedSections.has('reading')
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {submittedSections.has('reading') ? 'Reset Reading ↺' : 'Check Reading Answers'}
                    </button>

                    <button 
                        onClick={() => {
                             setCurrentSection('listening');
                             window.scrollTo({ top: 0, behavior: 'auto' });
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-surface-muted hover:opacity-85 rounded-full text-foreground font-medium transition-colors"
                    >
                        Next Section: Listening
                        <span aria-hidden="true">&rarr;</span>
                    </button>
                </div>
            </div>
         )}

         {/* Section 3: Listening */}
         {currentSection === 'listening' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Unified Audio Player Logic */}
                {(() => {
                    // Extract all audio URLs from listening sections
                    const audioUrls = new Set<string>();
                    listeningSections.forEach(s => {
                        s.questions.forEach(q => {
                            if (q.audioUrl) audioUrls.add(q.audioUrl);
                        });
                    });
                    
                    const uniqueUrls = Array.from(audioUrls);
                    const isSingleAudio = uniqueUrls.length === 1;
                    const singleAudioUrl = isSingleAudio ? uniqueUrls[0] : null;

                    return (
                        <>
                            {/* Sticky Player for Single Audio File */}
                            {isSingleAudio && singleAudioUrl && (
                                <div className="sticky top-20 z-40 bg-surface/95 backdrop-blur border border-border-soft p-4 rounded-xl shadow-lg mb-8 flex flex-col items-center">
                                    <h3 className="text-sm font-semibold text-text-muted mb-2 uppercase tracking-wider">Exam Audio Track</h3>
                                    <audio controls className="w-full max-w-3xl h-12">
                                        <source src={singleAudioUrl} type="audio/mpeg" />
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            )}

                            {listeningSections.map(section => (
                                <section key={section.id} className="bg-surface p-4 md:p-6 rounded-lg shadow-sm border border-border-soft">
                                    <div className="mb-6 flex flex-col items-center justify-center py-6 bg-surface-muted rounded-lg border border-border-soft">
                                        <div className="mb-4 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-xl font-bold text-foreground mb-2">{section.title}</h2>
                                        
                                        {/* Show per-section player ONLY if NOT using single audio mode */}
                                        {!isSingleAudio && (
                                            <>
                                                <p className="text-sm text-text-muted mb-6 max-w-lg text-center">
                                                    Listen to the audio and answer the questions below. 
                                                </p>
                                                
                                                {section.passageContent ? (
                                                    <div 
                                                        className="w-full max-w-2xl mb-6 flex flex-col items-center"
                                                        dangerouslySetInnerHTML={{ __html: section.passageContent }}
                                                    />
                                                ) : section.questions.some(q => q.audioUrl) && (
                                                    <audio controls className="w-full max-w-md">
                                                        <source src={section.questions.find((q: any) => q.audioUrl)?.audioUrl} type="audio/mpeg" />
                                                        Your browser does not support the audio element.
                                                    </audio>
                                                )}
                                            </>
                                        )}
                                        {isSingleAudio && (
                                             <p className="text-sm text-text-muted mb-2 italic">
                                                (Audio available in the player above)
                                             </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        {section.questions.map((q) => (
                                            <QuestionCard 
                                                key={q.id}
                                                instruction={q.instruction || undefined}
                                                questionNumber={q.number}
                                                questionText={q.text}
                                                choices={q.choices}
                                                correctChoiceId={q.correctChoiceId} 
                                                isSubmitted={submittedSections.has('listening')} 
                                                selectedChoiceId={answers[q.id]}
                                                onSelectChoice={(cid) => handleSelect(q.id, cid)}
                                                layout="stack"
                                            />
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </>
                    );
                })()}

                <div className="flex justify-center border-t border-border-soft pt-6 gap-4">
                     <button 
                        onClick={() => setCurrentSection('reading')}
                        className="flex items-center gap-2 px-6 py-3 text-text-muted hover:bg-surface-muted rounded-full font-medium transition-colors"
                    >
                        &larr; Previous Section
                    </button>
                    
                    {/* Listening Check Button */}
                    <button
                        onClick={() => submittedSections.has('listening') ? handleSectionReset('listening') : handleSectionSubmit('listening')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${
                            submittedSections.has('listening')
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {submittedSections.has('listening') ? 'Reset Listening ↺' : 'Finish & Check Listening'}
                    </button>
                </div>
            </div>
         )}

      </main>

      <Modal isOpen={showScoreModal} onClose={() => setShowScoreModal(false)} title="Assessment Complete">
        <div className="text-center py-6">
            <div className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {globalScore} / {globalTotal}
            </div>
            <p className="text-lg text-foreground/80 mb-6">
                You scored <span className="font-bold">{percentage}%</span> on this practice test.
                <br />
                <span className="text-sm text-text-muted font-normal">
                    Time Taken: {formatTime(timeElapsed)}
                </span>
            </p>
            <div className="w-full h-4 bg-surface-muted rounded-full overflow-hidden mb-6">
                <div className="h-full bg-blue-600 transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }} />
            </div>
            <p className="text-sm text-text-muted">
                Review your answers below to identify areas for improvement.
            </p>
            <button 
                onClick={() => setShowScoreModal(false)}
                className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors"
            >
                Review Answers
            </button>
        </div>
      </Modal>

    </div>
  );
}

