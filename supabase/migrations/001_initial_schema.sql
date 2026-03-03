-- Events table
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date timestamptz not null,
  location text not null,
  description text,
  image_url text not null,
  image_path text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for public timeline queries
create index idx_events_published_date on events (event_date)
  where status = 'published';

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger events_updated_at
  before update on events
  for each row
  execute function update_updated_at();

-- RLS
alter table events enable row level security;

-- Public: read only published events
create policy "Public can read published events"
  on events for select
  using (status = 'published');

-- Authenticated: full access
create policy "Authenticated users have full access"
  on events for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Storage bucket for event images
-- Run this in Supabase dashboard SQL editor:
-- insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- values ('event-images', 'event-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);
