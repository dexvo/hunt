-- ============================================================
-- LYNX — Additional Schema (append to schema.sql)
-- ============================================================

-- ── PUSH TOKENS ───────────────────────────────────────────
create table if not exists public.push_tokens (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles on delete cascade not null,
  token       text not null,
  platform    text check (platform in ('ios', 'android')),
  updated_at  timestamptz default now(),
  unique (user_id, platform)
);

alter table public.push_tokens enable row level security;

create policy "push_tokens_own"
  on public.push_tokens
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── GEOLOCATION RPC ───────────────────────────────────────
-- Replace the placeholder view with this function
-- Call from app: supabase.rpc('get_nearby_profiles', { user_lat, user_lng, radius_km, p_intent, p_online, p_verified })

create or replace function get_nearby_profiles(
  user_lat    double precision,
  user_lng    double precision,
  radius_km   double precision default 50,
  p_intent    text default null,
  p_online    boolean default false,
  p_verified  boolean default false,
  p_limit     int default 30,
  p_offset    int default 0
)
returns table (
  id            uuid,
  display_name  text,
  age           int,
  city          text,
  photos        text[],
  video_intro   text,
  is_verified   boolean,
  is_online     boolean,
  intent_mode   text,
  is_premium    boolean,
  distance_km   double precision
)
language sql stable as $$
  select
    p.id,
    p.display_name,
    p.age,
    p.city,
    p.photos,
    p.video_intro,
    p.is_verified,
    p.is_online,
    p.intent_mode,
    p.is_premium,
    round(cast(
      6371 * acos(
        least(1.0, greatest(-1.0,
          cos(radians(user_lat)) * cos(radians(p.latitude)) *
          cos(radians(p.longitude) - radians(user_lng)) +
          sin(radians(user_lat)) * sin(radians(p.latitude))
        ))
      )
    as numeric), 2)::double precision as distance_km
  from public.profiles p
  where
    p.is_incognito = false
    and p.latitude is not null
    and p.longitude is not null
    and p.id != auth.uid()
    and (p_intent is null or p.intent_mode = p_intent)
    and (not p_online or p.is_online = true)
    and (not p_verified or p.is_verified = true)
    and 6371 * acos(
      least(1.0, greatest(-1.0,
        cos(radians(user_lat)) * cos(radians(p.latitude)) *
        cos(radians(p.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(p.latitude))
      ))
    ) <= radius_km
  order by
    p.is_online desc,
    distance_km asc
  limit p_limit
  offset p_offset;
$$;

-- ── PRIVATE ALBUMS TABLE ──────────────────────────────────
create table if not exists public.private_albums (
  id           uuid default uuid_generate_v4() primary key,
  owner_id     uuid references public.profiles on delete cascade not null,
  shared_with  uuid[] default '{}',
  photos       text[] default '{}',
  expires_at   timestamptz,
  created_at   timestamptz default now()
);

alter table public.private_albums enable row level security;

create policy "albums_owner_all"
  on public.private_albums
  using (auth.uid() = owner_id);

create policy "albums_shared_read"
  on public.private_albums for select
  using (auth.uid() = any(shared_with));

-- ── ADMIN + VERIFICATION ADDITIONS ───────────────────────

-- Add is_admin and verification columns to profiles
alter table public.profiles
  add column if not exists is_admin boolean default false,
  add column if not exists verification_status text default 'unverified'
    check (verification_status in ('unverified', 'pending', 'approved', 'rejected', 'banned')),
  add column if not exists verification_selfie text;

-- Verification media bucket (private)
insert into storage.buckets (id, name, public)
  values ('verification-media', 'verification-media', false)
  on conflict do nothing;

-- Only the user can upload their own selfie
create policy "verification_upload_own"
  on storage.objects for insert
  with check (
    bucket_id = 'verification-media'
    and auth.uid()::text = (storage.foldername(name))[2]
  );

-- Only admins can read verification selfies
create policy "verification_read_admin"
  on storage.objects for select
  using (
    bucket_id = 'verification-media'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Admin full access policy on profiles
create policy "profiles_admin_all"
  on public.profiles
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ── SET YOUR ACCOUNT AS ADMIN ─────────────────────────────
-- After signing up, run this with your user ID from Supabase Auth dashboard:
-- update public.profiles set is_admin = true where id = 'YOUR_USER_ID_HERE';
