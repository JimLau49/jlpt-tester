import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function reset() {
    console.log("Dropping all tables...");
    try {
        await db.execute(sql`DROP SCHEMA public CASCADE;`);
        await db.execute(sql`CREATE SCHEMA public;`);
        await db.execute(sql`GRANT ALL ON SCHEMA public TO postgres;`);
        await db.execute(sql`GRANT ALL ON SCHEMA public TO public;`);
        console.log("Database reset complete.");
    } catch (e) {
        console.error("Reset failed:", e);
    }
    process.exit(0);
}

reset();
