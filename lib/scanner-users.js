import crypto from "crypto";
import { getSupabaseAdmin } from "./supabase";

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalize(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    type: user.user_type || "Kiosk",
    active: user.active,
    created_at: user.created_at,
  };
}

export const ScannerUserRepo = {
  list: async () => {
    const { data, error } = await getSupabaseAdmin()
      .from("scanner_users")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data.map(normalize);
  },

  create: async ({ name, username, password, type, active }) => {
    if (!name || !username || !password || !type) {
      throw new Error("Name, username, password, and type are required");
    }
    if (!["Admin", "Kiosk", "Premvati"].includes(type)) {
      throw new Error("Invalid user type");
    }

    const { data, error } = await getSupabaseAdmin()
      .from("scanner_users")
      .insert([
        {
          id: crypto.randomUUID(),
          name,
          username: username.toLowerCase(),
          password_hash: hash(password),
          user_type: type,
          active: active !== false,
        },
      ])
      .select("*")
      .single();

    if (error) throw error;
    return normalize(data);
  },

  update: async ({ id, name, username, password, type, active }) => {
    if (!["Admin", "Kiosk", "Premvati"].includes(type)) {
      throw new Error("Invalid user type");
    }
    const updates = {
      name,
      username: username.toLowerCase(),
      user_type: type,
      active: active !== false,
    };
    if (password) updates.password_hash = hash(password);

    const { data, error } = await getSupabaseAdmin()
      .from("scanner_users")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return normalize(data);
  },

  remove: async (id) => {
    const { error } = await getSupabaseAdmin()
      .from("scanner_users")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  authenticate: async ({ username, password }) => {
    const { data, error } = await getSupabaseAdmin()
      .from("scanner_users")
      .select("*")
      .eq("username", String(username || "").toLowerCase())
      .eq("active", true)
      .maybeSingle();

    if (error) throw error;
    if (!data || data.password_hash !== hash(String(password || "")))
      return null;
    return data;
  },

  findById: async (id) => {
    const { data, error } = await getSupabaseAdmin()
      .from("scanner_users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};

export function scannerSessionToken(user) {
  return hash(`${user.id}:${user.password_hash}`);
}
