-- Allow Superadmin and menu-specific Premvati roles such as Premvati-Pizza.
alter table scanner_users drop constraint if exists scanner_users_user_type_check;
alter table scanner_users add constraint scanner_users_user_type_check check (
  user_type in ('Superadmin', 'Admin', 'Kiosk', 'Premvati')
  or user_type like 'Premvati-%'
);

-- Optional: promote an existing admin to Superadmin
-- update scanner_users set user_type = 'Superadmin' where username = 'your-username';
