import { createDatabaseClient } from "./client.js";
import { initialMigrationName } from "./migrations.js";

const expectedTables = [
  "users",
  "jobs",
  "invitations",
  "password_reset_tokens",
  "web_sessions",
  "schema_migrations"
];
const client = createDatabaseClient();

try {
  await client.connect();
  const tables = await client.query<{ table_name: string }>(
    `select table_name
     from information_schema.tables
     where table_schema = 'public'
       and table_name = any($1::text[])
     order by table_name`,
    [expectedTables]
  );
  const jobCount = await client.query<{ count: string }>("select count(*) as count from jobs");
  const migrations = await client.query<{ name: string }>("select name from schema_migrations order by name");
  const foundTables = tables.rows.map((row) => row.table_name);
  const missingTables = expectedTables.filter((table) => !foundTables.includes(table));
  if (missingTables.length > 0) {
    throw new Error(`Database verification failed; missing tables: ${missingTables.join(", ")}`);
  }
  if (!migrations.rows.some((row) => row.name === initialMigrationName)) {
    throw new Error(`Database verification failed; missing migration: ${initialMigrationName}`);
  }

  console.log(
    JSON.stringify(
      {
        tables: foundTables,
        jobs: Number(jobCount.rows[0].count),
        migrations: migrations.rows.map((row) => row.name)
      },
      null,
      2
    )
  );
} finally {
  await client.end();
}
