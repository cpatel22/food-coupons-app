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
  customer_email text,
  customer_phone text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table menu_items (
  id text primary key,
  name text not null,
  description text,
  price numeric not null,
  image_url text not null,
  stock_qty integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_records (
  order_id text primary key,
  customer_email text not null,
  payment_last4 text not null,
  payment_method text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS (Row Level Security) if you want to restrict access, 
-- but for this demo/server-side matching, basic table is fine.
-- If using from client-side (Scan page), you might need policies.
-- For simplicity in this demo, we will use the Anon Key but logic runs server-side mostly.
-- The Scan page calls an API which uses the Service Role (or Anon if allowed).
-- Actually, our API routes run on server, so they can use Service Role if needed, 
-- but usually Anon key with policies is standard.
-- Let's just create the table first.
