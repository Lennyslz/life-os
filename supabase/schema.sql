-- Life OS · esquema completo. Pégalo en Supabase > SQL Editor > Run (en un proyecto nuevo).
-- Cada fila pertenece a un usuario (user_id); RLS impide ver o tocar filas ajenas.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  goal text,
  status text not null default 'activo' check (status in ('activo','pausado','terminado')),
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null check (char_length(title) between 1 and 500),
  done boolean not null default false,
  completed_at timestamptz,
  due_date date,
  due_time time,
  priority text not null default 'media' check (priority in ('alta','media','baja')),
  category text,
  created_at timestamptz not null default now()
);
create index tasks_user_due_idx on public.tasks (user_id, due_date);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  -- días programados: 0 = domingo ... 6 = sábado (igual que Date#getDay en JavaScript)
  schedule_days smallint[] not null default '{0,1,2,3,4,5,6}',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  log_date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);
create index habit_logs_user_date_idx on public.habit_logs (user_id, log_date);

create table public.gratitudes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  entry_date date not null,
  created_at timestamptz not null default now()
);
create index gratitudes_user_date_idx on public.gratitudes (user_id, entry_date);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  event_date date not null,
  start_time time,
  created_at timestamptz not null default now()
);
create index events_user_date_idx on public.events (user_id, event_date);

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('estudio','trabajo')),
  title text not null check (char_length(title) between 1 and 300),
  subject text,
  type text not null default 'Entrega',
  due_date date,
  status text not null default 'pendiente' check (status in ('pendiente','en_progreso','hecho')),
  created_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null default 'Nueva nota',
  content text not null default '' check (char_length(content) <= 50000),
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('gasto','ingreso')),
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  description text,
  tx_date date not null,
  created_at timestamptz not null default now()
);
create index transactions_user_date_idx on public.transactions (user_id, tx_date);

create table public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date not null,
  passage text,
  reflection text,
  prayer text,
  created_at timestamptz not null default now()
);
create index readings_user_date_idx on public.readings (user_id, entry_date);

-- Row Level Security -------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['projects','habits','gratitudes','events','work_items','transactions','readings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy "own rows" on public.%I for all to authenticated
      using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))$p$, t);
  end loop;
end $$;

-- Tablas con referencias: además, solo pueden apuntar a filas del mismo usuario.
alter table public.tasks enable row level security;
create policy "own rows" on public.tasks for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and (project_id is null or exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))));

alter table public.notes enable row level security;
create policy "own rows" on public.notes for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and (project_id is null or exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))));

alter table public.habit_logs enable row level security;
create policy "own rows" on public.habit_logs for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid())));
