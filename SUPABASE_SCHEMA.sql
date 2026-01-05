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

-- Enable RLS (Row Level Security) if you want to restrict access, 
-- but for this demo/server-side matching, basic table is fine.
-- If using from client-side (Scan page), you might need policies.
-- For simplicity in this demo, we will use the Anon Key but logic runs server-side mostly.
-- The Scan page calls an API which uses the Service Role (or Anon if allowed).
-- Actually, our API routes run on server, so they can use Service Role if needed, 
-- but usually Anon key with policies is standard.
-- Let's just create the table first.
