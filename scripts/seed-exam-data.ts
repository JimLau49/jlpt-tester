
import { db } from "../lib/db";
import { exams, sections, questions, choices, files } from "../lib/db/schema";
import { findLocalMedia } from "./_local-media";
import {
    mimeTypeFor,
    resolveStorageKey,
    objectExists,
    uploadObject,
    isR2Configured,
} from "../lib/storage/r2";
import { eq, and, asc } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { SeedExam, SeedQuestion } from "../lib/types/seed-data";

// Usage: npx tsx scripts/seed-exam-data.ts


/**
 * Returns the files.id for a media filename, uploading it to R2 on first sight.
 * Media bytes live in the bucket; Postgres only keeps the key.
 */
async function ensureFileRecord(filename: string): Promise<number | null> {
    const existing = await db.select().from(files).where(eq(files.filename, filename)).limit(1);

    const localPath = findLocalMedia(filename);
    const key = resolveStorageKey(filename, localPath);
    const mime = mimeTypeFor(filename);
    const useR2 = isR2Configured();

    // Without R2 configured we still record the key; because keys mirror
    // public/, publicUrlFor() serves the local copy and dev works unchanged.
    const putIfNeeded = async () => {
        if (!useR2 || !localPath) return;
        if (await objectExists(key)) return;
        await uploadObject(key, fs.readFileSync(localPath), mime);
        console.log(`    -> Uploaded to R2: ${key}`);
    };

    if (existing.length > 0) {
        // Backfill rows left over from the bytea era.
        if (!existing[0].storageKey && localPath) {
            await putIfNeeded();
            await db.update(files).set({ storageKey: key, mimeType: mime }).where(eq(files.id, existing[0].id));
            console.log(`    -> Linked ${filename} -> ${key}`);
        }
        return existing[0].id;
    }

    if (!localPath) return null;

    await putIfNeeded();

    const [newFile] = await db.insert(files).values({
        filename,
        mimeType: mime,
        storageKey: key,
    }).returning();

    return newFile.id;
}

async function main() {
    console.log("Starting JSON Seed Process (Safe Upsert Mode)...");

    const dataDir = path.join(process.cwd(), "data", "exams");
    if (!fs.existsSync(dataDir)) {
        console.error("No data directory found at data/exams");
        return;
    }

    let filesList = fs.readdirSync(dataDir).filter(f => f.endsWith(".json"));
    
    // Optional filter from command line
    const targetFilter = process.argv[2];
    if (targetFilter) {
        console.log(`Filtering for files containing: "${targetFilter}"`);
        filesList = filesList.filter(f => f.includes(targetFilter));
    }

    if (filesList.length === 0) {
        console.log("No matching JSON exam files found.");
        return;
    }

    console.log(`Found ${filesList.length} exam files:`, filesList);

    for (const file of filesList) {
        const filePath = path.join(dataDir, file);
        const raw = fs.readFileSync(filePath, "utf-8");
        const examData: SeedExam = JSON.parse(raw);

        console.log(`\nProcessing ${examData.level} ${examData.year} ${examData.session}...`);

        // 1. Upsert Exam
        let examId: number;
        const existingExams = await db.select().from(exams).where(
            and(
                eq(exams.year, examData.year),
                eq(exams.session, examData.session),
                eq(exams.level, examData.level)
            )
        ).limit(1);

        if (existingExams.length > 0) {
            examId = existingExams[0].id;
            console.log(`  -> Found existing exam (ID: ${examId}). Syncing content...`);
            // Update exam metadata if needed
            await db.update(exams)
                .set({ active: true })
                .where(eq(exams.id, examId));
        } else {
            const [newExam] = await db.insert(exams).values({
                level: examData.level,
                year: examData.year,
                session: examData.session,
                active: true,
            }).returning();
            examId = newExam.id;
            console.log(`  -> Created New Exam (ID: ${examId})`);
        }

        // 2. Upsert Sections
        console.log(`  -> Syncing ${examData.sections.length} sections...`);
        for (const sec of examData.sections) {
            let sectionId: number;
            console.log(`    -> Processing section: ${sec.title} (Order: ${sec.order})`);
            
            // Try to find section by order (stable within exam usually)
            const existingSection = await db.select().from(sections).where(
                and(
                    eq(sections.examId, examId),
                    eq(sections.order, sec.order)
                )
            ).limit(1);

            if (existingSection.length > 0) {
                sectionId = existingSection[0].id;
                // Update
                await db.update(sections).set({
                    type: sec.type,
                    title: sec.title,
                    passageTitle: sec.passageTitle,
                    passageContent: sec.passageContent,
                }).where(eq(sections.id, sectionId));
            } else {
                // Insert
                const [newSec] = await db.insert(sections).values({
                    examId: examId,
                    type: sec.type,
                    title: sec.title,
                    order: sec.order,
                    passageTitle: sec.passageTitle,
                    passageContent: sec.passageContent,
                }).returning();
                sectionId = newSec.id;
            }

            // 3. Upsert Questions
            console.log(`      -> Syncing ${sec.questions.length} questions for section ${sectionId}...`);
            for (const q of sec.questions) {
                // Determine Audio File ID
                // Handle q.audioFilename OR q.audioUrl (from parser)
                let filename = q.audioFilename;
                if (!filename && (q as any).audioUrl) {
                    filename = path.basename((q as any).audioUrl);
                }

                let audioDetailId: number | null = null;
                if (filename) {
                    audioDetailId = await ensureFileRecord(filename);
                }

                // Check for Question
                let questionId: number;
                const existingQuestion = await db.select().from(questions).where(
                    and(
                        eq(questions.sectionId, sectionId),
                        eq(questions.number, q.number)
                    )
                ).limit(1);

                if (existingQuestion.length > 0) {
                    questionId = existingQuestion[0].id;
                    await db.update(questions).set({
                        text: q.text,
                        instruction: q.instruction,
                        audioFileId: audioDetailId
                    }).where(eq(questions.id, questionId));
                } else {
                    const [newQ] = await db.insert(questions).values({
                        sectionId: sectionId,
                        number: q.number,
                        text: q.text,
                        instruction: q.instruction,
                        audioFileId: audioDetailId,
                    }).returning();
                    questionId = newQ.id;
                }

                // 4. Upsert Choices (By Index to preserve IDs)
                if (q.choices.length > 0) {
                    const existingChoices = await db.select().from(choices)
                        .where(eq(choices.questionId, questionId))
                        .orderBy(asc(choices.id)); // Order by creation/ID to match list
                    
                    for (let i = 0; i < q.choices.length; i++) {
                        const choiceData = q.choices[i];
                        
                        // Handle Image Upload for Choice
                        let choiceImageId: number | null = null;
                        if ((choiceData as any).imageFilename) {
                            choiceImageId = await ensureFileRecord((choiceData as any).imageFilename);
                        }

                        if (existingChoices[i]) {
                            // Update
                             await db.update(choices).set({
                                text: choiceData.text,
                                isCorrect: choiceData.isCorrect,
                                imageFileId: choiceImageId
                            }).where(eq(choices.id, existingChoices[i].id));
                        } else {
                            // Insert
                            await db.insert(choices).values({
                                questionId: questionId,
                                text: choiceData.text,
                                isCorrect: choiceData.isCorrect,
                                imageFileId: choiceImageId
                            });
                        }
                    }

                    // Delete extra choices if any
                    if (existingChoices.length > q.choices.length) {
                        for (let k = q.choices.length; k < existingChoices.length; k++) {
                             await db.delete(choices).where(eq(choices.id, existingChoices[k].id));
                        }
                    }
                }
            }
        }
        console.log("  -> Exam Sync Complete.");
    }
    console.log("\nAll Seeds Completed Successfully.");
}

main().catch(console.error);
