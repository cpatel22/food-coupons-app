const CART_STORAGE_KEY = "food_coupons_cart";

export function loadCart() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCart(items) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}
