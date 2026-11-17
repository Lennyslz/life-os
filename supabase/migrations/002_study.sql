-- Life OS · migración 002: cursos y sesiones de estudio.
-- Es ADITIVA: no toca tablas existentes. Ejecútala en Supabase > SQL Editor después de schema.sql.

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index courses_user_idx on public.courses (user_id);

-- Historial de estudio. Solo se guardan sesiones con tiempo de estudio real:
--   completed   = el temporizador llegó a cero
--   ended_early = el usuario pulsó "Finalizar y guardar" antes de cero
-- Los descansos y las sesiones canceladas NO se guardan.
-- El id lo genera el cliente al iniciar la sesión: la clave primaria impide registros duplicados.
-- ON DELETE RESTRICT: no se puede borrar un curso que tenga historial (se archiva).
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds > 0 and duration_seconds <= 86400),
  status text not null check (status in ('completed','ended_early')),
  created_at timestamptz not null default now(),
  check (ended_at >= started_at)
);
create index study_sessions_user_ended_idx on public.study_sessions (user_id, ended_at desc);
create index study_sessions_course_idx on public.study_sessions (course_id);

alter table public.courses enable row level security;
create policy "own rows" on public.courses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter table public.study_sessions enable row level security;
create policy "own rows" on public.study_sessions for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.courses c where c.id = course_id and c.user_id = (select auth.uid())));
