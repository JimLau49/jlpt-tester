import { pgTable, serial, text, integer, boolean, timestamp, pgEnum, customType } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: string }>({
  dataType() {
    return 'bytea';
  },
});

export const sectionTypeEnum = pgEnum('section_type', ['vocab', 'reading', 'listening']);

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  // Object-storage key (R2), e.g. "audio/n1_dec_2015_listening_full.mp3".
  // Media lives in R2, not Postgres; build a URL with publicUrlFor().
  storageKey: text("storage_key"),
  // Legacy inline blob. Nullable while migrating; dropped once backfill is verified.
  data: bytea("data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const examLevelEnum = pgEnum('kb_exam_level', ['N1', 'N2', 'N3', 'N4', 'N5']);
export const examSessionEnum = pgEnum('kb_exam_session', ['July', 'December']);

export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  level: examLevelEnum("level").notNull(),
  year: integer("year").notNull(),
  session: examSessionEnum("session").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ensure sections links to exams, not quizzes
export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").references(() => exams.id).notNull(),
  type: sectionTypeEnum("type").notNull(),
  title: text("title"), 
  order: integer("order").notNull().default(1),
  passageTitle: text("passage_title"), // For Reading headers
  passageContent: text("passage_content"), // Rich html content
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").references(() => sections.id).notNull(),
  number: integer("number").notNull(), // Question number (1, 2, ..., 45)
  text: text("text").notNull(), 
  instruction: text("instruction"),
  
  // Media Linking
  audioFileId: integer("audio_file_id").references(() => files.id),
  imageFileId: integer("image_file_id").references(() => files.id),
  
  hasRichContent: boolean("has_rich_content").default(false),
});

export const choices = pgTable("choices", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => questions.id).notNull(),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  imageFileId: integer("image_file_id").references(() => files.id),
});

