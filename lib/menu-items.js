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
    deactivate_threshold: Number(item.deactivate_threshold || 0),
    active: item.active,
  };
}

export const MenuItemRepo = {
  listPublic: async () => {
    const { data, error } = await getSupabaseAdmin()
      .from("menu_items")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return data
      .map(normalizeItem)
      .filter((item) => item.stock_qty > item.deactivate_threshold);
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
      deactivate_threshold: Number(item.deactivate_threshold || 0),
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
      deactivate_threshold: Number(item.deactivate_threshold || 0),
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
    const nextActive = MenuItemRepo.evalActive(
      nextQty,
      Number(data.deactivate_threshold || 0),
      data.active,
    );
    return MenuItemRepo.update({
      id,
      name: data.name,
      description: data.description,
      price: data.price,
      image: data.image_url,
      stock_qty: nextQty,
      deactivate_threshold: Number(data.deactivate_threshold || 0),
      active: nextActive,
    });
  },

  evalActive: (stockQty, threshold, currentlyActive) => {
    if (!currentlyActive && Number(stockQty) > Number(threshold)) {
      return true;
    }

    return Number(stockQty) > Number(threshold);
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

      const remainingQty = Number(menuItem.stock_qty) - Number(item.qty);
      if (remainingQty < Number(menuItem.deactivate_threshold || 0)) {
        throw new Error(`${item.name} has only ${Math.max(0, Number(menuItem.stock_qty) - Number(menuItem.deactivate_threshold || 0))} left`);
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

      const nextActive = MenuItemRepo.evalActive(
        remainingQty,
        Number(menuItem.deactivate_threshold || 0),
        menuItem.active,
      );

      const { error: updateError } = await getSupabaseAdmin()
        .from("menu_items")
        .update({
          stock_qty: remainingQty,
          active: nextActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", menuItem.id);

      if (updateError) {
        throw updateError;
      }
    }
  },
};
