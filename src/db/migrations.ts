export type Queryable = {
  query(sql: string, params?: unknown[]): Promise<unknown>;
};

export const initialMigrationName = "001_online_foundation";

export const initialMigrationSql = `
do $$
declare
  experimental_migration_applied boolean := false;
begin
  if to_regclass('public.schema_migrations') is not null then
    execute 'select exists (
      select 1 from schema_migrations where name = ''001_initial_postgres_foundation''
    )' into experimental_migration_applied;
  end if;

  if experimental_migration_applied then
    raise exception 'Experimental database migration detected; manual non-destructive migration review is required.';
  end if;
end $$;

create table if not exists schema_migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists users (
  id bigserial primary key,
  email text not null,
  password_hash text not null,
  display_name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  is_active boolean not null default true,
  auth_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_email_lower_unique on users (lower(email));

create table if not exists jobs (
  id bigserial primary key,
  legacy_local_id text,
  source text not null check (source in ('boss', 'shixiseng')),
  source_url text not null default '',
  dedupe_key text not null unique,
  title text not null,
  company_name text not null default '',
  city text not null default '',
  salary_text text not null default '',
  duration_text text not null default '',
  education_text text not null default '',
  work_days_per_week_text text not null default '',
  description text not null default '',
  source_publish_time text not null default '',
  tags text[] not null default '{}',
  raw_text text not null default '',
  match_score integer,
  match_reasons text[] not null default '{}',
  resume_advice text[] not null default '{}',
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  updated_at timestamptz not null default now(),
  is_active boolean not null default true
);

create unique index if not exists jobs_legacy_local_id_unique
  on jobs (legacy_local_id)
  where legacy_local_id is not null and legacy_local_id <> '';

create index if not exists jobs_source_city_idx on jobs (source, city);
create index if not exists jobs_title_company_idx on jobs (title, company_name);

create table if not exists invitations (
  id bigserial primary key,
  code_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by_user_id bigint references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists invitations_expires_at_idx on invitations (expires_at);

create table if not exists password_reset_tokens (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  created_by text not null default 'local-admin'
);

create index if not exists password_reset_tokens_expires_at_idx
  on password_reset_tokens (expires_at);

create table if not exists web_sessions (
  sid varchar not null primary key,
  sess json not null,
  expire timestamptz not null
);

create index if not exists web_sessions_expire_idx on web_sessions (expire);
`;

export async function runInitialMigration(client: Queryable): Promise<void> {
  await client.query("begin");
  try {
    await client.query(initialMigrationSql);
    await client.query(
      `insert into schema_migrations (name)
       values ($1)
       on conflict (name) do nothing`,
      [initialMigrationName]
    );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}
