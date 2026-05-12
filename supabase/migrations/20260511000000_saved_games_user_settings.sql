-- Stage 3: one in-progress saved game per user + settings (RLS via auth.uid()).

create table public.saved_games (
  user_id uuid not null primary key references auth.users (id) on delete cascade,
  seed text not null,
  columns smallint not null,
  deals smallint not null,
  deck_pair_id text not null,
  joker_count smallint not null default 0,
  state jsonb not null,
  history jsonb not null,
  updated_at timestamptz not null default now()
);

create index saved_games_updated_at_idx on public.saved_games (updated_at desc);

alter table public.saved_games enable row level security;

create policy "saved_games_select_own"
  on public.saved_games for select
  using (auth.uid() = user_id);

create policy "saved_games_insert_own"
  on public.saved_games for insert
  with check (auth.uid() = user_id);

create policy "saved_games_update_own"
  on public.saved_games for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "saved_games_delete_own"
  on public.saved_games for delete
  using (auth.uid() = user_id);

create table public.user_settings (
  user_id uuid not null primary key references auth.users (id) on delete cascade,
  sound_enabled boolean not null default true,
  confirm_save boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings_select_own"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "user_settings_insert_own"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "user_settings_update_own"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_settings_delete_own"
  on public.user_settings for delete
  using (auth.uid() = user_id);
