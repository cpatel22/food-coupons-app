-- Creates the table if needed, or migrates the previous value/text_value schema.
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'app_settings'
  ) then
    create table app_settings (
      key text primary key,
      value text not null,
      updated_at timestamptz not null default now()
    );
  else
    alter table app_settings add column if not exists app_settings_value_text text;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'app_settings'
        and column_name = 'text_value'
    ) then
      update app_settings
      set app_settings_value_text = coalesce(text_value, value::text);
    else
      update app_settings
      set app_settings_value_text = value::text;
    end if;

    alter table app_settings drop column if exists text_value;
    alter table app_settings drop column value;
    alter table app_settings rename column app_settings_value_text to value;
    alter table app_settings alter column value set not null;
  end if;
end $$;

insert into app_settings (key, value) values
  ('qr_group_by_item', 'true'),
  ('show_menu_as_grid', 'true'),
  ('allow_pay_now', 'true'),
  ('allow_pay_at_kiosk', 'true'),
  ('print_coupons_required', 'true'),
  ('email_coupons_required', 'true'),
  ('download_coupons_required', 'true')
on conflict (key) do nothing;
