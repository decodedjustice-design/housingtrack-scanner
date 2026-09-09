create extension if not exists pgcrypto;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  canonical_id text not null unique,
  name text not null,
  address text,
  city text not null,
  state text not null default 'WA',
  postal_code text,
  latitude double precision,
  longitude double precision,
  manager text,
  owner text,
  official_url text,
  leasing_url text,
  eligibility_status text not null default 'needs_program_confirmation',
  exclusion_reason text,
  source_dataset text,
  source_record text,
  first_seen_at timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists properties_city_idx on public.properties(city);
create index if not exists properties_eligibility_idx on public.properties(eligibility_status);

create table if not exists public.property_programs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  program text not null,
  ami_min numeric,
  ami_max numeric,
  notes text,
  verified boolean not null default false,
  verified_at timestamptz,
  source_url text,
  created_at timestamptz not null default now(),
  unique(property_id, program)
);

create index if not exists property_programs_program_idx on public.property_programs(program);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  external_unit_id text,
  bedroom_type text,
  bathrooms numeric,
  sqft integer,
  rent numeric,
  availability_date date,
  features jsonb not null default '{}'::jsonb,
  source_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, external_unit_id)
);

create index if not exists units_property_idx on public.units(property_id);
create index if not exists units_bedrooms_idx on public.units(bedroom_type);
create index if not exists units_rent_idx on public.units(rent);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete set null,
  url text not null unique,
  source_type text not null default 'official',
  source_name text,
  active boolean not null default true,
  last_checked_at timestamptz,
  last_http_status integer,
  last_error text,
  created_at timestamptz not null default now()
);

create table if not exists public.scan_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null,
  completed_at timestamptz,
  scanner_version text,
  properties_scanned integer not null default 0,
  available_count integer not null default 0,
  review_count integer not null default 0,
  error_count integer not null default 0,
  external_lead_count integer not null default 0,
  status text not null default 'running',
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists scan_runs_started_idx on public.scan_runs(started_at desc);

create table if not exists public.availability_checks (
  id uuid primary key default gen_random_uuid(),
  scan_run_id uuid references public.scan_runs(id) on delete set null,
  property_id uuid not null references public.properties(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  checked_at timestamptz not null default now(),
  status text not null,
  eligibility_status text,
  bedroom_type text,
  rent numeric,
  sqft integer,
  availability_date date,
  signal text,
  evidence jsonb not null default '{}'::jsonb
);

create index if not exists availability_checks_property_idx on public.availability_checks(property_id, checked_at desc);
create index if not exists availability_checks_status_idx on public.availability_checks(status, checked_at desc);

create table if not exists public.availability_changes (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  detected_at timestamptz not null default now(),
  change_type text not null,
  previous_status text,
  new_status text,
  previous_value jsonb,
  new_value jsonb,
  source_url text,
  acknowledged_at timestamptz
);

create index if not exists availability_changes_detected_idx on public.availability_changes(detected_at desc);

create table if not exists public.external_leads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete set null,
  source_name text not null,
  url text not null,
  title text,
  city text,
  program_terms text[],
  found_at timestamptz not null default now(),
  verification_status text not null default 'lead_only',
  verified_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  unique(source_name, url)
);

create table if not exists public.alert_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  cities text[] not null default '{}',
  programs text[] not null default '{ARCH,MFTE}',
  bedroom_types text[] not null default '{}',
  max_rent numeric,
  min_sqft integer,
  feature_terms text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.alert_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  change_id uuid references public.availability_changes(id) on delete cascade,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  channel text,
  status text not null default 'pending'
);

alter table public.properties enable row level security;
alter table public.property_programs enable row level security;
alter table public.units enable row level security;
alter table public.sources enable row level security;
alter table public.scan_runs enable row level security;
alter table public.availability_checks enable row level security;
alter table public.availability_changes enable row level security;
alter table public.external_leads enable row level security;
alter table public.alert_preferences enable row level security;
alter table public.alert_events enable row level security;

create policy "public can read properties" on public.properties for select using (true);
create policy "public can read programs" on public.property_programs for select using (true);
create policy "public can read units" on public.units for select using (true);
create policy "public can read sources" on public.sources for select using (true);
create policy "public can read scan runs" on public.scan_runs for select using (true);
create policy "public can read availability checks" on public.availability_checks for select using (true);
create policy "public can read availability changes" on public.availability_changes for select using (true);
create policy "public can read external leads" on public.external_leads for select using (true);

create policy "users manage own alert preferences" on public.alert_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read own alert events" on public.alert_events
  for select using (auth.uid() = user_id);

create or replace view public.current_availability as
select distinct on (ac.property_id, coalesce(ac.bedroom_type, 'unknown'))
  ac.id,
  ac.property_id,
  p.canonical_id,
  p.name as property_name,
  p.city,
  ac.checked_at,
  ac.status,
  ac.eligibility_status,
  ac.bedroom_type,
  ac.rent,
  ac.sqft,
  ac.availability_date,
  ac.signal,
  ac.evidence,
  p.official_url,
  p.leasing_url
from public.availability_checks ac
join public.properties p on p.id = ac.property_id
order by ac.property_id, coalesce(ac.bedroom_type, 'unknown'), ac.checked_at desc;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists properties_updated_at on public.properties;
create trigger properties_updated_at before update on public.properties for each row execute function public.set_updated_at();
drop trigger if exists units_updated_at on public.units;
create trigger units_updated_at before update on public.units for each row execute function public.set_updated_at();
drop trigger if exists alert_preferences_updated_at on public.alert_preferences;
create trigger alert_preferences_updated_at before update on public.alert_preferences for each row execute function public.set_updated_at();
