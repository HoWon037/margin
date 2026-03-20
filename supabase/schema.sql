create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  login_id text not null unique,
  nickname text not null,
  avatar_color text not null default 'slate' check (
    avatar_color in ('violet', 'lightBlue', 'green', 'amber', 'slate')
  ),
  created_at timestamptz not null default now()
);

alter table public.users
  add column if not exists login_id text;

create unique index if not exists users_login_id_key
on public.users (login_id);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  weekly_goal_type text not null check (weekly_goal_type in ('days', 'pages')),
  weekly_goal_value integer not null check (weekly_goal_value > 0),
  invite_code text not null unique,
  owner_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  title text not null,
  author text not null,
  total_pages integer not null check (total_pages > 0),
  status text not null default 'reading' check (status in ('reading', 'finished')),
  created_by uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.books
  add column if not exists total_pages integer;

alter table public.books
  alter column total_pages set default 1;

update public.books
set total_pages = 1
where total_pages is null;

alter table public.books
  alter column total_pages set not null;

create table if not exists public.reading_logs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  book_id uuid references public.books (id) on delete set null,
  date date not null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  did_read boolean not null,
  pages_read integer not null default 0 check (pages_read >= 0),
  memo text,
  reading_time integer check (reading_time >= 0),
  start_page integer check (start_page >= 0),
  end_page integer check (end_page >= 0),
  mood_tag text,
  created_at timestamptz not null default now(),
  unique (group_id, user_id, date)
);

alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.books enable row level security;
alter table public.reading_logs enable row level security;

create policy "users_select_shared_profiles"
on public.users
for select
using (
  auth.uid() = id
  or exists (
    select 1
    from public.group_members gm_self
    join public.group_members gm_other
      on gm_self.group_id = gm_other.group_id
    where gm_self.user_id = auth.uid()
      and gm_other.user_id = public.users.id
  )
);

create policy "users_insert_own_profile"
on public.users
for insert
with check (auth.uid() = id);

create policy "users_update_own_profile"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "groups_select_member_groups"
on public.groups
for select
using (
  exists (
    select 1
    from public.group_members
    where group_members.group_id = public.groups.id
      and group_members.user_id = auth.uid()
  )
);

create policy "groups_insert_owner"
on public.groups
for insert
with check (owner_id = auth.uid());

create policy "groups_update_owner"
on public.groups
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "groups_delete_owner"
on public.groups
for delete
using (owner_id = auth.uid());

create policy "group_members_select_members"
on public.group_members
for select
using (
  exists (
    select 1
    from public.group_members gm_self
    where gm_self.group_id = public.group_members.group_id
      and gm_self.user_id = auth.uid()
  )
);

create policy "group_members_insert_self"
on public.group_members
for insert
with check (user_id = auth.uid());

create policy "group_members_delete_owner_or_self"
on public.group_members
for delete
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.groups
    where groups.id = public.group_members.group_id
      and groups.owner_id = auth.uid()
  )
);

create policy "books_select_group_members"
on public.books
for select
using (
  exists (
    select 1
    from public.group_members
    where group_members.group_id = public.books.group_id
      and group_members.user_id = auth.uid()
  )
);

create policy "books_insert_group_members"
on public.books
for insert
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.group_members
    where group_members.group_id = public.books.group_id
      and group_members.user_id = auth.uid()
  )
);

create policy "books_update_owner_or_creator"
on public.books
for update
using (
  created_by = auth.uid()
  or exists (
    select 1
    from public.groups
    where groups.id = public.books.group_id
      and groups.owner_id = auth.uid()
  )
)
with check (
  created_by = auth.uid()
  or exists (
    select 1
    from public.groups
    where groups.id = public.books.group_id
      and groups.owner_id = auth.uid()
  )
);

create policy "reading_logs_select_group_members"
on public.reading_logs
for select
using (
  exists (
    select 1
    from public.group_members
    where group_members.group_id = public.reading_logs.group_id
      and group_members.user_id = auth.uid()
  )
);

create policy "reading_logs_insert_self"
on public.reading_logs
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.group_members
    where group_members.group_id = public.reading_logs.group_id
      and group_members.user_id = auth.uid()
  )
);

create policy "reading_logs_update_self"
on public.reading_logs
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "reading_logs_delete_self_or_owner"
on public.reading_logs
for delete
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.groups
    where groups.id = public.reading_logs.group_id
      and groups.owner_id = auth.uid()
  )
);
