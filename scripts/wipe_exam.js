require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

const targetExamId = process.argv[2];

if (!targetExamId) {
    console.error("Please provide exam ID (e.g. n1_dec_2014) or integer ID");
    process.exit(1);
}

async function main() {
    await client.connect();
    
    // Get integer ID if string provided
    let examIdInt;
    if (isNaN(targetExamId)) {
        const res = await client.query("SELECT id FROM exams WHERE id = CAST($1 AS INTEGER)", [targetExamId]).catch(() => null);
        // Wait, id is serial int. But we usually look up by string match?? 
        // No, in seed script we look up by... checking files?
        // Actually the exam table has `id` (serial). The `n1_dec_2014` is not stored in DB as ID usually unless I made a column for it?
        // Schema:
        // export const exams = pgTable("exams", { id: serial("id").primaryKey(), level: ..., year: ..., session: ... });
        // It does NOT have a string ID column like `slug`.
        // So `n1_dec_2014` matches logic `level='N1' AND year=2014 AND session='December'`.
        
        console.log(`Looking up exam for ${targetExamId}...`);
        // assume format n1_dec_2014
        const parts = targetExamId.split('_');
        const level = parts[0].toUpperCase();
        const sessionMap = { dec: 'December', july: 'July' };
        const session = sessionMap[parts[1]];
        const year = parseInt(parts[2]);
        
        const examRes = await client.query("SELECT id FROM exams WHERE level = $1 AND year = $2 AND session = $3", [level, year, session]);
        if (examRes.rows.length === 0) {
            console.log("Exam not found in DB.");
            await client.end();
            return;
        }
        examIdInt = examRes.rows[0].id;
    } else {
        examIdInt = parseInt(targetExamId);
    }

    console.log(`Wiping Data for Exam ID: ${examIdInt}`);
    
    // Delete choices first? No, cascade? Check schema reference.
    // Usually manual deletion is safer order: Choices -> Questions -> Sections -> Exam
    
    // 1. Delete Choices (linked to questions)
    // Need question IDs
    
    await client.query("BEGIN");
    try {
        // Find Sections
        const secRes = await client.query("SELECT id FROM sections WHERE exam_id = $1", [examIdInt]);
        const secIds = secRes.rows.map(r => r.id);
        
        if (secIds.length > 0) {
             // Find Questions
             const qRes = await client.query(`SELECT id FROM questions WHERE section_id = ANY($1::int[])`, [secIds]);
             const qIds = qRes.rows.map(r => r.id);
             
             if (qIds.length > 0) {
                 // Delete Choices
                 const delC = await client.query(`DELETE FROM choices WHERE question_id = ANY($1::int[])`, [qIds]);
                 console.log(`Deleted ${delC.rowCount} choices.`);
                 
                 // Delete Questions
                 const delQ = await client.query(`DELETE FROM questions WHERE id = ANY($1::int[])`, [qIds]);
                 console.log(`Deleted ${delQ.rowCount} questions.`);
             }
             
             // Delete Sections
             const delS = await client.query(`DELETE FROM sections WHERE id = ANY($1::int[])`, [secIds]);
             console.log(`Deleted ${delS.rowCount} sections.`);
        }
        
        // Delete Exam
        const delE = await client.query("DELETE FROM exams WHERE id = $1", [examIdInt]);
        console.log(`Deleted ${delE.rowCount} exam entry.`);
        
        await client.query("COMMIT");
        console.log("Successfully wiped exam.");
    } catch (e) {
        await client.query("ROLLBACK");
        console.error("Error wiping exam:", e);
    }
    
    await client.end();
}

main();
