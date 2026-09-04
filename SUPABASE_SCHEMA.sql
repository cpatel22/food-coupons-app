-- Create the coupons table in the Supabase SQL Editor

create table coupons (
  code text primary key,
  session_id text not null,
  menu_item_name text not null,
  qty integer default 1,
  price numeric,
  is_used boolean default false,
  voided_at timestamptz
);

create table kiosk_orders (
  id text primary key,
  items jsonb not null,
  total_qty integer not null,
  total_price numeric not null,
  status text not null default 'pending',
  customer_name text,
  customer_email text,
  customer_phone text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- If the table already exists, add the new column with:
-- alter table kiosk_orders add column if not exists customer_name text;

create table menu_items (
  id text primary key,
  name text not null,
  description text,
  price numeric not null,
  image_url text not null,
  stock_qty integer not null default 0,
  deactivate_threshold integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If the table already exists, add the new column with:
-- alter table menu_items add column if not exists deactivate_threshold integer not null default 0;

create table order_records (
  order_id text primary key,
  customer_email text not null,
  payment_last4 text not null,
  payment_method text not null,
  created_at timestamptz not null default now()
);

create table scanner_users (
  id text primary key,
  name text not null,
  username text not null unique,
  password_hash text not null,
  user_type text not null check (user_type in ('Admin', 'Kiosk', 'Premvati')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table scan_logs (
  id uuid primary key default gen_random_uuid(),
  scanner_user_id text not null references scanner_users(id),
  scanner_user_type text not null,
  scan_type text not null,
  scanned_value text not null,
  result text not null,
  created_at timestamptz not null default now()
);

-- If the table already exists, add the user type with:
-- alter table scanner_users add column if not exists user_type text not null default 'Kiosk';
-- alter table scanner_users drop constraint if exists scanner_users_user_type_check;
-- alter table scanner_users add constraint scanner_users_user_type_check check (user_type in ('Admin', 'Kiosk', 'Premvati'));

-- Enable RLS (Row Level Security) if you want to restrict access, 
-- but for this demo/server-side matching, basic table is fine.
-- If using from client-side (Scan page), you might need policies.
-- For simplicity in this demo, we will use the Anon Key but logic runs server-side mostly.
-- The Scan page calls an API which uses the Service Role (or Anon if allowed).
-- Actually, our API routes run on server, so they can use Service Role if needed, 
-- but usually Anon key with policies is standard.
-- Let's just create the table first.
