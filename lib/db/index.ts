import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL!;

let db: any;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

if (connectionString.startsWith("postgres://")) {
    // Local Docker Connection
    const pool = new Pool({ connectionString });
    db = drizzlePg(pool, { schema });
} else {
    // Neon Serverless Connection
    const client = neon(connectionString);
    db = drizzle(client, { schema });
}

export { db };
