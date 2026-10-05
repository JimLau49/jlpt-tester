import { db } from "@/lib/db";
import { exams, sections, questions, choices, files } from "@/lib/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
import { publicUrlFor } from "@/lib/storage/url";
import QuizRunner, { QuizData, SectionData, Question, Choice } from "@/components/QuizRunner";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

// db is typed `any` in lib/db, so joined rows need explicit shapes here.
type SectionRow = typeof sections.$inferSelect;
type QuestionRow = typeof questions.$inferSelect & { audioStorageKey: string | null };
type ChoiceRow = typeof choices.$inferSelect & { imageStorageKey: string | null };

export default async function ExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const id = parseInt(examId);

  if (isNaN(id)) {
    return notFound();
  }

  // 1. Fetch Specific Exam
  const examRecords = await db.select().from(exams).where(eq(exams.id, id)).limit(1);

  if (examRecords.length === 0) {
     return notFound();
  }

  const exam = examRecords[0];

  // 2. Fetch Sections
  const sectionRecords: SectionRow[] = await db.select()
    .from(sections)
    .where(eq(sections.examId, exam.id))
    .orderBy(asc(sections.order));

  if (sectionRecords.length === 0) {
      return <div className="p-8 text-center text-text-muted">This exam has no sections yet.</div>;
  }

  const sectionIds = sectionRecords.map((s: SectionRow) => s.id);

  // 3. Fetch Questions + Audio
  const questionsData: QuestionRow[] = await db.select({
      ...questions,
      audioStorageKey: files.storageKey
  })
  .from(questions)
  .leftJoin(files, eq(questions.audioFileId, files.id))
  .where(inArray(questions.sectionId, sectionIds))
  .orderBy(asc(questions.number));

  const questionIds = questionsData.map((q: QuestionRow) => q.id);

  // 4. Fetch Choices
  const choiceRecords: ChoiceRow[] = (questionIds.length > 0)
    ? await db.select({
        ...choices,
        imageStorageKey: files.storageKey
    })
    .from(choices)
    .leftJoin(files, eq(choices.imageFileId, files.id))
    .where(inArray(choices.questionId, questionIds))
    : [];

  // 5. Structure Data
  const sectionsPayload: SectionData[] = sectionRecords.map((sec: SectionRow) => {
      const secQs = questionsData.filter((q: QuestionRow) => q.sectionId === sec.id);

      const qsPayload: Question[] = secQs.map((q: QuestionRow) => {
          const qChoicesRecord = choiceRecords.filter((c: ChoiceRow) => c.questionId === q.id);
          const qChoices: Choice[] = qChoicesRecord.map((c: ChoiceRow) => ({
              id: c.id,
              text: c.text,
              imageUrl: publicUrlFor(c.imageStorageKey)
          }));
          const correctChoice = qChoicesRecord.find((c: ChoiceRow) => c.isCorrect);

          return {
              id: q.id,
              number: q.number,
              text: q.text,
              instruction: q.instruction || undefined,
              choices: qChoices,
              correctChoiceId: correctChoice ? correctChoice.id : -1,
              audioUrl: publicUrlFor(q.audioStorageKey)
          };
      });

      return {
          id: sec.id,
          type: sec.type as 'vocab' | 'reading' | 'listening',
          title: sec.title || '',
          passageTitle: sec.passageTitle || undefined,
          passageContent: sec.passageContent || undefined,
          questions: qsPayload
      };
  });

  const quizData: QuizData = {
      id: exam.id,
      level: exam.level,
      year: exam.year,
      session: exam.session,
      sections: sectionsPayload
  };

  return <QuizRunner data={quizData} />;
}
