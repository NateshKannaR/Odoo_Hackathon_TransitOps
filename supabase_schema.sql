-- ============================================================
-- TransitOps — Supabase SQL Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('fleet_manager','driver','safety_officer','financial_analyst')),
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Vehicles
create table vehicles (
  id uuid default gen_random_uuid() primary key,
  plate_number text not null unique,
  make text,
  model text,
  year int,
  capacity int,
  status text default 'active' check (status in ('active','inactive','maintenance')),
  created_at timestamptz default now()
);

-- Drivers
create table drivers (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  license_number text not null unique,
  phone text,
  status text default 'available' check (status in ('available','on_trip','off_duty')),
  created_at timestamptz default now()
);

-- Trips
create table trips (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete set null,
  driver_id uuid references drivers(id) on delete set null,
  origin text not null,
  destination text not null,
  scheduled_at timestamptz,
  status text default 'scheduled' check (status in ('scheduled','in_progress','completed','cancelled')),
  created_at timestamptz default now()
);

-- Maintenance Logs
create table maintenance_logs (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade,
  description text not null,
  cost numeric(10,2),
  service_date date,
  next_service_date date,
  status text default 'pending' check (status in ('pending','in_progress','completed')),
  created_at timestamptz default now()
);

-- Fuel Logs
create table fuel_logs (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade,
  driver_id uuid references drivers(id) on delete set null,
  liters numeric(8,2),
  cost_per_liter numeric(8,2),
  total_cost numeric(10,2),
  fueled_at date,
  created_at timestamptz default now()
);

-- Expenses
create table expenses (
  id uuid default gen_random_uuid() primary key,
  category text not null check (category in ('fuel','maintenance','insurance','toll','salary','other')),
  description text,
  amount numeric(10,2) not null,
  expense_date date,
  vehicle_id uuid references vehicles(id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================================
-- RLS Policies — enable for all tables
-- ============================================================
alter table profiles enable row level security;
alter table vehicles enable row level security;
alter table drivers enable row level security;
alter table trips enable row level security;
alter table maintenance_logs enable row level security;
alter table fuel_logs enable row level security;
alter table expenses enable row level security;

-- Authenticated users can read everything
create policy "auth read" on vehicles for select using (auth.role() = 'authenticated');
create policy "auth read" on drivers for select using (auth.role() = 'authenticated');
create policy "auth read" on trips for select using (auth.role() = 'authenticated');
create policy "auth read" on maintenance_logs for select using (auth.role() = 'authenticated');
create policy "auth read" on fuel_logs for select using (auth.role() = 'authenticated');
create policy "auth read" on expenses for select using (auth.role() = 'authenticated');
create policy "auth read" on profiles for select using (auth.role() = 'authenticated');

-- Authenticated users can insert/update/delete (RBAC enforced in frontend)
create policy "auth write" on vehicles for all using (auth.role() = 'authenticated');
create policy "auth write" on drivers for all using (auth.role() = 'authenticated');
create policy "auth write" on trips for all using (auth.role() = 'authenticated');
create policy "auth write" on maintenance_logs for all using (auth.role() = 'authenticated');
create policy "auth write" on fuel_logs for all using (auth.role() = 'authenticated');
create policy "auth write" on expenses for all using (auth.role() = 'authenticated');

-- ============================================================
-- Seed: create test users via Supabase Dashboard > Auth > Users
-- Then manually insert profiles:
-- ============================================================
-- insert into profiles (id, full_name, role) values
--   ('<user-uuid>', 'Alice Manager', 'fleet_manager'),
--   ('<user-uuid>', 'Bob Driver', 'driver'),
--   ('<user-uuid>', 'Carol Safety', 'safety_officer'),
--   ('<user-uuid>', 'Dave Finance', 'financial_analyst');
