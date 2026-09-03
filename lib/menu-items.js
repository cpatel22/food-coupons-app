import { v4 as uuidv4 } from "uuid";
import { getSupabaseAdmin } from "./supabase";

function normalizeItem(item) {
  return {
    id: item.id,
    name: item.name,
    description: item.description || "",
    price: Number(item.price),
    image: item.image_url,
    stock_qty: Number(item.stock_qty),
    active: item.active,
  };
}

export const MenuItemRepo = {
  listPublic: async () => {
    const { data, error } = await getSupabaseAdmin()
      .from("menu_items")
      .select("*")
      .eq("active", true)
      .gt("stock_qty", 10)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(normalizeItem);
  },

  listAll: async () => {
    const { data, error } = await getSupabaseAdmin()
      .from("menu_items")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(normalizeItem);
  },

  create: async (item) => {
    const payload = {
      id: uuidv4(),
      name: item.name,
      description: item.description || "",
      price: Number(item.price),
      image_url: item.image,
      stock_qty: Number(item.stock_qty),
      active: item.active !== false,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("menu_items")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return normalizeItem(data);
  },

  update: async (item) => {
    const payload = {
      name: item.name,
      description: item.description || "",
      price: Number(item.price),
      image_url: item.image,
      stock_qty: Number(item.stock_qty),
      active: item.active !== false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await getSupabaseAdmin()
      .from("menu_items")
      .update(payload)
      .eq("id", item.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return normalizeItem(data);
  },

  remove: async (id) => {
    const { error } = await getSupabaseAdmin()
      .from("menu_items")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }
  },

  adjustStock: async ({ id, delta }) => {
    const { data, error } = await getSupabaseAdmin()
      .from("menu_items")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    const nextQty = Math.max(0, Number(data.stock_qty) + Number(delta));
    return MenuItemRepo.update({
      id,
      name: data.name,
      description: data.description,
      price: data.price,
      image: data.image_url,
      stock_qty: nextQty,
      active: data.active,
    });
  },

  assertAvailable: async (items) => {
    const { data, error } = await getSupabaseAdmin()
      .from("menu_items")
      .select("*");

    if (error) {
      throw error;
    }

    const itemMap = new Map(data.map((item) => [item.id, item]));
    const itemNameMap = new Map(data.map((item) => [item.name, item]));

    for (const item of items) {
      const menuItem = itemMap.get(item.id) || itemNameMap.get(item.name);

      if (!menuItem || !menuItem.active) {
        throw new Error(`${item.name} is no longer available`);
      }

      if (Number(menuItem.stock_qty) < Number(item.qty)) {
        throw new Error(`${item.name} has only ${menuItem.stock_qty} left`);
      }
    }
  },

  decrementStock: async (items) => {
    const { data, error } = await getSupabaseAdmin()
      .from("menu_items")
      .select("*");

    if (error) {
      throw error;
    }

    const itemMap = new Map(data.map((item) => [item.id, item]));
    const itemNameMap = new Map(data.map((item) => [item.name, item]));

    for (const item of items) {
      const menuItem = itemMap.get(item.id) || itemNameMap.get(item.name);
      if (!menuItem) {
        throw new Error(`${item.name} not found`);
      }

      const remainingQty = Number(menuItem.stock_qty) - Number(item.qty);
      if (remainingQty < 0) {
        throw new Error(`${item.name} is out of stock`);
      }

      const { error: updateError } = await getSupabaseAdmin()
        .from("menu_items")
        .update({
          stock_qty: remainingQty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", menuItem.id);

      if (updateError) {
        throw updateError;
      }
    }
  },
};
