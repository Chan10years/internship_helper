import { internshipsJsonPath } from "../config.js";
import { loadJobs } from "../storage/loadJobs.js";
import { createDatabaseClient } from "./client.js";
import { importJobs } from "./jobImport.js";
import { runInitialMigration } from "./migrations.js";

const client = createDatabaseClient();

try {
  await client.connect();
  await runInitialMigration(client);
  const jobs = await loadJobs(internshipsJsonPath);
  const imported = await importJobs(client, jobs);
  console.log(`Imported ${imported} jobs into PostgreSQL.`);
} finally {
  await client.end();
}
