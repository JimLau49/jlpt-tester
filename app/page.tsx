import { db } from "@/lib/db";
import { exams } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// db is typed `any` in lib/db, so query results need an explicit shape.
type ExamRow = typeof exams.$inferSelect;

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const allExams: ExamRow[] = await db.select().from(exams).orderBy(desc(exams.year), desc(exams.session));

  return (
    <div className="min-h-screen bg-background font-sans transition-colors duration-300">
       <header className="bg-surface border-b border-border-soft h-16 flex items-center justify-between px-6 md:px-12">
            <Link href="/" className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
                JLPT Tester Dashboard
            </Link>
            <div className="flex items-center gap-4">
                 <ThemeToggle />
            </div>
       </header>

       <main className="max-w-5xl mx-auto p-6 md:p-12 space-y-8">
            <section className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-foreground">Available Practice Exams</h1>
                <p className="text-text-muted max-w-xl mx-auto">Select an exam to begin your simulation. Good luck!</p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allExams.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-surface rounded-xl border border-border-soft">
                        <p className="text-text-muted">No exams found.</p>
                        <p className="text-sm text-text-muted/70 mt-2">Try running the seed script.</p>
                    </div>
                ) : (
                    allExams.map((exam: ExamRow) => (
                        <Link
                            key={exam.id}
                            href={`/exams/${exam.id}`}
                            className="group block bg-surface border border-border-soft rounded-xl p-6 hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 text-sm font-bold rounded-full 
                                    ${exam.level === 'N1' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 
                                      exam.level === 'N2' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                    {exam.level}
                                </span>
                                {exam.active && <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">● Active</span>}
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-1">
                                {exam.year} {exam.session}
                            </h3>
                            <p className="text-sm text-text-muted">
                                Full mock exam including Vocabulary, Reading, and Listening.
                            </p>
                            <div className="mt-6 flex items-center text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
                                Start Exam &rarr;
                            </div>
                        </Link>
                    ))
                )}
            </div>
       </main>
    </div>
  );
}
