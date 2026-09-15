import { getSupabaseAdmin } from "./supabase";

export const DEFAULT_SETTINGS = {
  qr_group_by_item: true,
  show_menu_as_grid: true,
  email_enabled: true,
  allow_pay_now: true,
  allow_pay_at_kiosk: true,
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_pass: "",
  email_from: "",
  stripe_secret_key: "",
  stripe_publishable_key: "",
};

const BOOLEAN_SETTINGS = new Set([
  "qr_group_by_item",
  "show_menu_as_grid",
  "email_enabled",
  "allow_pay_now",
  "allow_pay_at_kiosk",
]);

export async function getSettings({ includeSecrets = false } = {}) {
  const { data, error } = await getSupabaseAdmin()
    .from("app_settings")
    .select("key, value");

  if (error) throw error;

  const settings = data.reduce((result, setting) => {
    result[setting.key] = BOOLEAN_SETTINGS.has(setting.key)
      ? setting.value === true || setting.value === "true"
      : setting.value;
    return result;
  }, { ...DEFAULT_SETTINGS });

  if (!includeSecrets) {
    delete settings.smtp_pass;
    delete settings.stripe_secret_key;
    delete settings.stripe_publishable_key;
  }

  return settings;
}

export async function updateSettings(values) {
  const current = await getSettings({ includeSecrets: true });
  const settings = {
    qr_group_by_item: Boolean(values.qr_group_by_item),
    show_menu_as_grid: Boolean(values.show_menu_as_grid),
    email_enabled: Boolean(values.email_enabled),
    allow_pay_now: Boolean(values.allow_pay_now),
    allow_pay_at_kiosk: Boolean(values.allow_pay_at_kiosk),
    smtp_host: String(values.smtp_host || "").trim(),
    smtp_port: String(values.smtp_port || "587").trim(),
    smtp_user: String(values.smtp_user || "").trim(),
    smtp_pass: values.smtp_pass === undefined ? current.smtp_pass : String(values.smtp_pass),
    email_from: String(values.email_from || "").trim(),
    stripe_secret_key: values.stripe_secret_key === undefined ? current.stripe_secret_key : String(values.stripe_secret_key),
    stripe_publishable_key: String(values.stripe_publishable_key || "").trim(),
  };

  const { error } = await getSupabaseAdmin().from("app_settings").upsert(
    Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value),
    })),
    { onConflict: "key" },
  );

  if (error) throw error;
  return settings;
}