import { createDatabaseClient } from "./client.js";
import { runInitialMigration } from "./migrations.js";

const client = createDatabaseClient();

try {
  await client.connect();
  await runInitialMigration(client);
  console.log("PostgreSQL migration completed.");
} finally {
  await client.end();
}
