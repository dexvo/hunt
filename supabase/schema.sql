-- LYNX — Full Supabase Schema
-- Run this first, then run schema_additions.sql

create extension if not exists "uuid-ossp";

-- ── PROFILES ──────────────────────────────────────────────
create table public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  display_name  text,
  age           int check (age >= 18 and age <= 99),
  city          text,
  bio           text,
  photos        text[] default '{}',
  video_intro   text,
  is_verified   boolean default false,
  is_online     boolean default false,
  is_premium    boolean default false,
  is_incognito  boolean default false,
  intent_mode   text default 'Chat' check (intent_mode in ('Now', 'Date', 'Chat', 'Travel')),
  latitude      double precision,
  longitude     double precision,
  last_seen     timestamptz default now(),
  updated_at    timestamptz default now(),
  created_at    timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_public"
  on public.profiles for select
  using (not is_incognito or auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── CONVERSATIONS ─────────────────────────────────────────
create table public.conversations (
  id           uuid default uuid_generate_v4() primary key,
  participants uuid[] not null,
  updated_at   timestamptz default now()
);

alter table public.conversations enable row level security;

create policy "conversations_participants"
  on public.conversations
  using (auth.uid() = any(participants));

-- ── MESSAGES ──────────────────────────────────────────────
create table public.messages (
  id              uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  sender_id       uuid references public.profiles on delete cascade not null,
  type            text default 'text' check (type in ('text', 'image', 'voice')),
  content         text not null,
  duration_secs   int,
  is_read         boolean default false,
  created_at      timestamptz default now()
);

alter table public.messages enable row level security;

create policy "messages_conversation_members"
  on public.messages
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and auth.uid() = any(c.participants)
    )
  );

-- Keep conversation updated_at current
create or replace function update_conversation_timestamp()
returns trigger language plpgsql as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_insert
  after insert on public.messages
  for each row execute procedure update_conversation_timestamp();

-- ── TAPS ──────────────────────────────────────────────────
create table public.taps (
  id               uuid default uuid_generate_v4() primary key,
  from_profile_id  uuid references public.profiles on delete cascade not null,
  to_profile_id    uuid references public.profiles on delete cascade not null,
  created_at       timestamptz default now(),
  unique (from_profile_id, to_profile_id)
);

alter table public.taps enable row level security;

create policy "taps_own"
  on public.taps
  using (auth.uid() = from_profile_id or auth.uid() = to_profile_id);

-- ── STORAGE BUCKETS ───────────────────────────────────────
insert into storage.buckets (id, name, public) values ('profile-media', 'profile-media', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('chat-media', 'chat-media', false) on conflict do nothing;

create policy "profile_media_upload"
  on storage.objects for insert
  with check (bucket_id = 'profile-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "profile_media_public_read"
  on storage.objects for select
  using (bucket_id = 'profile-media');

create policy "chat_media_upload"
  on storage.objects for insert
  with check (bucket_id = 'chat-media' and auth.role() = 'authenticated');

create policy "chat_media_read"
  on storage.objects for select
  using (bucket_id = 'chat-media' and auth.role() = 'authenticated');

-- ── REALTIME ──────────────────────────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
