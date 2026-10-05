import { db } from "../lib/db";
import { exams, sections, questions } from "../lib/db/schema";

async function check() {
    console.log("Checking DB...");
    try {
        const allExams = await db.select().from(exams);
        console.log("Exams:", allExams.length, allExams);
        
        const allSections = await db.select().from(sections);
        console.log("Sections:", allSections.length);

        const allQuestions = await db.select().from(questions);
        console.log("Questions:", allQuestions.length);
        
    } catch (e) {
        console.error("DB Check Failed:", e);
    }
    process.exit(0);
}

check();
