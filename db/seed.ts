import "dotenv/config";
import { getDb } from "../api/queries/connection";

async function seed() {
  const _db = getDb();
  void _db;
  console.log("Seeding database...");

  // TODO: Add seed data here if needed

  console.log("Done.");
  process.exit(0);
}

seed();
