
import { db } from "../lib/db";
import { exams, sections } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Database Exams Inventory (Manual Select):");
    
    // 1. Get Exams
    const allExams = await db.select().from(exams);
    
    for (const e of allExams) {
        // 2. Get Sections Count
        const examSections = await db.select().from(sections).where(eq(sections.examId, e.id));
        
        console.log(`[ID: ${e.id}] ${eLevel(e)} ${e.year} ${e.session} (Active: ${e.active}) -> Sections Check: ${examSections.length}`);
        
        // Print sections summary
        examSections.sort((a: any, b: any) => a.order - b.order);
        examSections.forEach((s: any) => {
             console.log(`   - Order ${s.order}: [Type: ${s.type}] ${s.title}`);
        });
    }
}

function eLevel(e: any) { return e.level; }

main().catch(console.error);
