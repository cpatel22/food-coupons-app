-- Add customer_id/email column to coupons
alter table coupons add column customer_info text;

-- This can hold email or stripe customer id
