export const ADMIN_TYPES = ["Admin", "Superadmin"];
export const BASE_USER_TYPES = ["Superadmin", "Admin", "Kiosk"];

export function isAdminType(type) {
  return ADMIN_TYPES.includes(type);
}

export function isSuperadminType(type) {
  return type === "Superadmin";
}

export function isPremvatiType(type) {
  return String(type || "")
    .toLowerCase()
    .startsWith("premvati");
}

export function isKioskType(type) {
  return type === "Kiosk";
}

export function slugifyItemName(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "");
}

export function premvatiRoleFromItemName(name) {
  const slug = slugifyItemName(name);
  return slug ? `Premvati-${slug}` : "";
}

export function isAllowedUserType(type) {
  if (["Superadmin", "Admin", "Kiosk", "Premvati"].includes(type)) return true;
  return (
    String(type || "").startsWith("Premvati-") &&
    type.length > "Premvati-".length
  );
}

export function couponAllowedForScanner(userType, menuItemName) {
  if (!isPremvatiType(userType)) return true;
  if (userType === "Premvati") return true;
  return (
    premvatiRoleFromItemName(menuItemName).toLowerCase() ===
    String(userType).toLowerCase()
  );
}

export function loginDestination(userType) {
  if (isAdminType(userType)) return "/admin/dashboard";
  if (isKioskType(userType)) return "/kiosk-scan";
  if (isPremvatiType(userType)) return "/scan";
  return "/login";
}
