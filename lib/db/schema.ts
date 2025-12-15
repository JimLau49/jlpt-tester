import { pgTable, serial, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const sectionTypeEnum = pgEnum("section_type", ["VOCAB", "GRAMMAR", "READING", "LISTENING"]);

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  level: text("level").notNull(), // N1, N2, N3, N4, N5
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => quizzes.id).notNull(),
  type: sectionTypeEnum("type").notNull(),
  title: text("title"), // Optional title for the section
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").references(() => sections.id).notNull(),
  textContent: text("text_content").notNull(), // Can contain markup for underlining
  audioUrl: text("audio_url"), // Optional audio for listening questions
  order: integer("order").notNull().default(0),
});

export const choices = pgTable("choices", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => questions.id).notNull(),
  textContent: text("text_content").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
});
