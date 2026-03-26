-- Drop existing tables (safe re-run)
drop table if exists logs     cascade;
drop table if exists codes    cascade;
drop table if exists products cascade;
drop table if exists users    cascade;

-- ── users ────────────────────────────────────────────────────
create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  role          text not null default 'USER'
                  check (role in ('ADMIN','USER')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index idx_users_email on users(email);

-- ── products ─────────────────────────────────────────────────
create table products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null,
  description text,
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index idx_products_category   on products(category);
create index idx_products_created_at on products(created_at desc);

-- ── codes ────────────────────────────────────────────────────
create table codes (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  code        text unique not null,
  status      text not null default 'valid'
                check (status in ('valid','used','invalid')),
  created_by  uuid references users(id) on delete set null,
  used_at     timestamptz,
  created_at  timestamptz default now()
);
create index idx_codes_product_id on codes(product_id);
create index idx_codes_code       on codes(code);
create index idx_codes_status     on codes(status);

-- ── logs ─────────────────────────────────────────────────────
create table logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete set null,
  action     text not null,
  details    jsonb default '{}'::jsonb,
  ip_address text,
  timestamp  timestamptz default now()
);
create index idx_logs_user_id   on logs(user_id);
create index idx_logs_action    on logs(action);
create index idx_logs_timestamp on logs(timestamp desc);

-- ── auto updated_at ──────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_users_updated_at    before update on users    for each row execute function set_updated_at();
create trigger trg_products_updated_at before update on products for each row execute function set_updated_at();

-- ── disable RLS (server-side service-role key bypasses anyway) ─
alter table users    disable row level security;
alter table products disable row level security;
alter table codes    disable row level security;
alter table logs     disable row level security;
