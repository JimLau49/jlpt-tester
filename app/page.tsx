"use client";

import { useState } from "react";
import { QuestionCard } from "@/components/ui/QuestionCard";
import { ReadingPassage } from "@/components/ui/ReadingPassage";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import { Modal } from "@/components/ui/Modal";
  
export default function Home() {
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  
  // Mock Vocab Data (Moved up to avoid initialization error)
  const vocabQuestions = [
    {
      id: 1,
      instruction: "問題1 ＿の言葉の読み方として最もよいものを、1から一つ選びなさい。",
      number: 1,
      text: "食品の[u]腐敗[/u]を防止する",
      correctChoiceId: 3,
      choices: [
        { id: 1, text: "からい" }, 
        { id: 2, text: "ふばい" }, 
        { id: 3, text: "ふはい" }, 
        { id: 4, text: "ふうはい" }, 
      ],
    },
    {
      id: 2,
      instruction: "問題1 ＿の言葉の読み方として最もよいものを、1から一つ選びなさい。",
      number: 2,
      text: "彼女はとても[u]謙虚[/u]な人だ。",
      correctChoiceId: 1,
      choices: [
        { id: 1, text: "けんきょ" }, 
        { id: 2, text: "かんきょ" }, 
        { id: 3, text: "きょうきょ" }, 
        { id: 4, text: "こんきょ" }, 
      ],
    },
  ];

  // Mock Reading Data (Moved up)
  const readingPassage = {
    title: "人は会いに行こう",
    content: `人に会いに行こうというと、当たり前だと思うでしょう。わざわざ人には会いに行こうとしたのは、電話や手紙(もしくはメール)ですませるのではなく、会うことに意味があるからです。

会うのは、コミュニケーションとしてきわめて重要です。つまり、コミュニケーション は自分の持っている情報を伝えるだけでなく、相手との共感がありますが、自分自身の規制、相手の規制にもつながる場合もあります。会って 【41】、相手も変わり、自分も変 わる可能性があるということです。

コミュニケーションではお互いにわかりあう、つまり共感がたいへん重要です。相手の身になって何かを感じる、それは相手の感情かもしれないし、痛みかもしれません。こうした共感こそ、人間のコミュニケーションです。

会わなくても電話や手紙(メール)でも、こうした共感は生まれますが、相手の身になることができるかというとむずかしいでしょう。やはり実際に 【42】 本当の共感は生まれると思います。

脳にとっても、刺激の度合いが違います。初恋の人とデートをしたときのことを 【43】。胸がどきどきして、たいへん緊張したでしょう。初恋の人でなくても、好きな人に会えば脳は活性化し、ときめき状態を維持しますし、反対に嫌いな人に会うとそれなりの負の感情が生まれてきます。感情の流れが生まれ、共感も発生します。当然、脳も喜びにあふれるでしょうし、反対に嫌悪の情が流れることもあるでしょう。それだけ活性化される 【44】。

やはり人には会いに行きましょう。ときめきを求めて。`,
  };

  const readingQuestions = [
    {
        id: 41,
        text: "【41】に入る最もよいものはどれか。",
        correctChoiceId: 3,
        choices: [
            { id: 1, text: "話したとしても" },
            { id: 2, text: "話そうものなら" },
            { id: 3, text: "話すことで" },
            { id: 4, text: "話さないかぎり" },
        ]
    },
    {
        id: 42,
        text: "【42】に入る最もよいものはどれか。",
        correctChoiceId: 1,
        choices: [
            { id: 1, text: "会ってこそ" },
            { id: 2, text: "会うからには" },
            { id: 3, text: "会うとすれば" },
            { id: 4, text: "会うにつれて" },
        ]
    }
  ];

  const [currentSection, setCurrentSection] = useState<'vocab' | 'reading' | 'listening'>('vocab');

  const handleSelect = (questionId: number, choiceId: string | number) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: choiceId }));
  };

  const calculateScore = () => {
    let score = 0;
    let total = 0;
    
    // Helper to check
    const check = (q: any) => {
        if (answers[q.id] === q.correctChoiceId) score++;
        total++;
    };

    vocabQuestions.forEach(check);
    readingQuestions.forEach(check);
    
    return { score, total };
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    setShowScoreModal(true);
  };

  // Switch to reading section
  const goToReading = () => {
      setCurrentSection('reading');
      window.scrollTo({ top: 0, behavior: 'auto' });
  }

  const { score, total } = isSubmitted ? calculateScore() : { score: 0, total: 0 };
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const libraryPassage = (
    <div className="space-y-4 text-sm">
        <div className="font-bold text-center mb-2">[秋川大学 - 秋川大学図書館 - 一般利用]</div>
        <h4 className="font-bold text-base text-center mb-4">一般の方の図書館利用について</h4>
        
        <p>秋川大学の学生以外の一般の方も、研究等の目的のために、秋川キャンパスにある中央図書館と文学部図書館の資料が利用できます。</p>

        <div> 
            <h5 className="font-bold mb-1">【入館方法】</h5>
            <ul className="list-disc pl-5 space-y-1">
                <li>図書館利用カードをお持ちの方は、自動入退館ゲートから入退館ができます。</li>
                <li>お持ちでない方は、カウンターで一日入館証を発行いたします。</li>
            </ul>
        </div>

        <div>
            <h5 className="font-bold mb-1">【図書館利用カードについて】</h5>
            <ul className="list-disc pl-5 space-y-1">
                <li>図書館利用カードは、図書館資料の貸し出しの際に必要になります。</li>
                <li>発行をご希望の方は、身分証明書をお持ちになり、中央図書館、または文学部図書館のカウンターにお越しください(文学部図書館では平日のみ受け付けています)。</li>
                <li>平日の9時から17時までの間に申請を受け付けた場合、その日のうちにカードをお渡しします。平日の17時以降、および土日に受け付けた場合は、次の平日開館日以降にお渡しします。</li>
            </ul>
        </div>
        
        <div>
           <h5 className="font-bold mb-1">【開館時間】</h5>
           <table className="w-full border-collapse border border-zinc-300 dark:border-zinc-700 text-xs md:text-sm">
               <thead>
                   <tr className="bg-zinc-200 dark:bg-zinc-800">
                       <th className="border border-zinc-300 dark:border-zinc-700 p-2"></th>
                       <th className="border border-zinc-300 dark:border-zinc-700 p-2">期間※</th>
                       <th className="border border-zinc-300 dark:border-zinc-700 p-2">平日</th>
                       <th className="border border-zinc-300 dark:border-zinc-700 p-2">土曜・日曜</th>
                   </tr>
               </thead>
               <tbody>
                   <tr>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2 font-bold" rowSpan={2}>中央<br/>図書館</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">授業期間</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">9:00 ~ 22:00</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">9:00 ~ 17:00</td>
                   </tr>
                    <tr>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">夏休み・春休み期間</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">9:00 ~ 19:00</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">休館</td>
                   </tr>
                    <tr>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2 font-bold" rowSpan={2}>文学部<br/>図書館</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">授業期間</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">9:00 ~ 21:00</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">9:00 ~ 17:00</td>
                   </tr>
                    <tr>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">夏休み・春休み期間</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">9:00 ~ 18:00</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">休館</td>
                   </tr>
               </tbody>
           </table>
        </div>
    </div>
  );

  const libraryQuestions = [
      {
        id: 45,
        text: "筆者の考えに合うのはどれか。",
        correctChoiceId: 4, 
        choices: [
            { id: 1, text: "本当に実力があれば、練習でできなかったことでも試合でできる。" },
            { id: 2, text: "全力で練習したから試合でも成功するというのは、甘い考えだ。" },
            { id: 3, text: "練習でしっかりできていても、試合で実力を発揮するのは難しい。" },
            { id: 4, text: "練習にも全力で取り組まなければ、試合でいい結果は出せない。" },
        ]
      }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-[family-name:var(--font-geist-sans)] transition-colors duration-300">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 h-16 flex items-center justify-between px-6 md:px-12">
        <div className="font-bold text-xl tracking-tight flex items-center gap-3">
             JLPT Tester 
             <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-100">N1 Mock 2024</span>
             
             {/* Simple Breadcrumb/Indicator */}
             <div className="hidden md:flex items-center gap-2 ml-4 text-sm font-medium">
                <span className={`px-2 py-0.5 rounded ${currentSection === 'vocab' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>Sec 1</span>
                <span className="text-zinc-300">/</span>
                <span className={`px-2 py-0.5 rounded ${currentSection === 'reading' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>Sec 2</span>
                <span className="text-zinc-300">/</span>
                <span className={`px-2 py-0.5 rounded ${currentSection === 'listening' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>Sec 3</span>
             </div>
        </div>
        <div className="flex items-center gap-4">
            {!isSubmitted && <span className="text-sm font-medium text-zinc-500 hidden md:block">Time Remaining: 109:20</span>}
            {isSubmitted && <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Score: {score}/{total}</span>}
            <button 
                onClick={handleSubmit}
                disabled={isSubmitted}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                title="Finish Test and Check Score"
            >
                {isSubmitted ? "Review Results" : "Finish & Check"}
            </button>
            <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-20 pb-20 max-w-7xl mx-auto px-4 md:px-6 space-y-12">
        
        {/* Section 1: Language Knowledge (Vocab/Grammar) + Reading (Section 7) */}
        {currentSection === 'vocab' && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Vocab Part */}
            <section className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-end">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Language Knowledge (Vocabulary / Grammar)</h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Questions 1 - 30</p>
                    </div>
                </div>
                
                <div className="flex flex-col">
                    {vocabQuestions.map((q) => (
                        <QuestionCard 
                            key={q.id}
                            instruction={q.id === 1 ? q.instruction : undefined} 
                            questionNumber={q.number}
                            questionText={q.text}
                            choices={q.choices}
                            correctChoiceId={q.correctChoiceId} 
                            isSubmitted={isSubmitted} 
                            selectedChoiceId={answers[q.id]}
                            onSelectChoice={(cid) => handleSelect(q.id, cid)}
                            layout="grid" // Short answers -> Grid
                        />
                    ))}
                </div>
            </section>

            {/* Reading Part 1 (Problem 7 - Moved here as requested) */}
            <section className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">問題 7 次の文章を読んで、 文章全体の内容を考えて、 41から 44 の中に入る最も よいものを１・2・3・4から一つ選びなさい</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Questions 41 - 44</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-start relative">
                    <div className="lg:w-1/2 lg:sticky lg:top-20 self-start">
                        <ReadingPassage 
                            title={readingPassage.title}
                            content={readingPassage.content}
                        />
                    </div>
                    <div className="lg:w-1/2 flex flex-col gap-1">
                        {readingQuestions.map((q) => (
                            <QuestionCard 
                                key={q.id}
                                questionNumber={q.id}
                                questionText={q.text}
                                choices={q.choices}
                                correctChoiceId={q.correctChoiceId}
                                isSubmitted={isSubmitted}
                                selectedChoiceId={answers[q.id]}
                                onSelectChoice={(cid) => handleSelect(q.id, cid)}
                                layout="stack" 
                            />
                        ))}
                    </div>
                </div>
            </section>

            <div className="flex justify-center border-t border-zinc-100 dark:border-zinc-800 pt-6">
                <button 
                    onClick={goToReading}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full text-zinc-900 dark:text-white font-medium transition-colors"
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
                
                {/* Part 2: Info Retrieval (Problem 8) */}
                <section className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
                    <div className="mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">問題 8 次の文章を読んで、 後の問いに対する答えとして、 最もよいものを１・2・3・4から一つ選びなさい。</h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Questions 45 - 46</p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6 items-start relative">
                        {/* Passage Column - Sticky & Wide for this type */}
                        <div className="lg:w-3/5 lg:sticky lg:top-20 self-start">
                            <ReadingPassage 
                                content={libraryPassage}
                            />
                        </div>

                        {/* Questions Column */}
                        <div className="lg:w-2/5 flex flex-col gap-1">
                            {libraryQuestions.map((q) => (
                                <QuestionCard 
                                    key={q.id}
                                    questionNumber={q.id}
                                    questionText={q.text}
                                    choices={q.choices}
                                    correctChoiceId={q.correctChoiceId}
                                    isSubmitted={isSubmitted}
                                    selectedChoiceId={answers[q.id]}
                                    onSelectChoice={(cid) => handleSelect(q.id, cid)}
                                    layout="stack" 
                                />
                            ))}
                        </div>
                    </div>
                </section>

                <div className="flex justify-center border-t border-zinc-100 dark:border-zinc-800 pt-6 gap-4">
                     <button 
                        onClick={() => setCurrentSection('vocab')}
                        className="flex items-center gap-2 px-6 py-3 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full font-medium transition-colors"
                    >
                        &larr; Previous Section
                    </button>
                    <button 
                        onClick={() => {
                             setCurrentSection('listening');
                             window.scrollTo({ top: 0, behavior: 'auto' });
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full text-zinc-900 dark:text-white font-medium transition-colors"
                    >
                        Next Section: Listening
                        <span aria-hidden="true">&rarr;</span>
                    </button>
                </div>
            </div>
         )}

         {/* Section 3: Listening (Placeholder) */}
         {currentSection === 'listening' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <section className="bg-white dark:bg-zinc-900 p-8 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 text-center py-20">
                     <div className="mb-6 mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                        </svg>
                     </div>
                     <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Listening Section</h2>
                     <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md mx-auto">
                        This section contains audio-based questions. Please ensure your volume is turned up.
                     </p>
                     
                     <div className="p-4 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 inline-block">
                         <p className="text-sm font-medium text-zinc-500">Listening Content Would Go Here</p>
                     </div>
                </section>

                <div className="flex justify-center border-t border-zinc-100 dark:border-zinc-800 pt-6 gap-4">
                     <button 
                        onClick={() => setCurrentSection('reading')}
                        className="flex items-center gap-2 px-6 py-3 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full font-medium transition-colors"
                    >
                        &larr; Previous Section
                    </button>
                    {/* Finish button is in header, but could add here too */}
                </div>
            </div>
         )}
      </main>

      <Modal isOpen={showScoreModal} onClose={() => setShowScoreModal(false)} title="Assessment Complete">
        <div className="text-center py-6">
            <div className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {score} / {total}
            </div>
            <p className="text-lg text-zinc-600 dark:text-zinc-300 mb-6">
                You scored <span className="font-bold">{percentage}%</span> on this practice test.
            </p>
            <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-blue-600 transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }} />
            </div>
            <p className="text-sm text-zinc-500">
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

