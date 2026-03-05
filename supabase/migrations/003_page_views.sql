create table page_views (
  id serial primary key,
  page text not null,
  visited_at timestamptz not null default now(),
  user_agent text,
  referrer text
);

create index idx_page_views_page_visited on page_views (page, visited_at);

alter table page_views enable row level security;

-- Allow anonymous inserts (public anon key can write)
create policy "Allow anonymous inserts"
  on page_views for insert
  to anon
  with check (true);

-- Allow authenticated users to read (for admin/dashboard queries)
create policy "Allow authenticated reads"
  on page_views for select
  to authenticated
  using (true);
