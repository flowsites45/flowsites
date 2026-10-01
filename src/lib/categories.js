/**
 * Central Category Management for Flowsites
 * Supports single and multiple categories per template.
 */

export const DEFAULT_CATEGORIES = [
  "Hero Section",
  "Landing Page",
  "UI Components",
  "Real Estate",
  "Food",
  "Health",
  "Agency",
  "Ecommerce",
  "Portfolio",
  "Saas",
  "Dashboard",
  "Background Assets",
];

export const BACKGROUND_CATEGORY = "Background Assets";

/**
 * Safely parses any category field (string, comma-separated string, JSON array, or array)
 * into a clean array of unique category strings.
 */
export function parseCategories(categoryField) {
  if (!categoryField) return [];
  
  if (Array.isArray(categoryField)) {
    return Array.from(new Set(categoryField.map((c) => String(c).trim()).filter(Boolean)));
  }

  if (typeof categoryField === "string") {
    const trimmed = categoryField.trim();
    if (!trimmed) return [];

    // Check if JSON array string e.g. ["Landing Page", "Hero Section"]
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return Array.from(new Set(parsed.map((c) => String(c).trim()).filter(Boolean)));
        }
      } catch {
        // Fall back to comma-separated parsing
      }
    }

    // Split on comma
    return Array.from(
      new Set(
        trimmed
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      )
    );
  }

  return [String(categoryField).trim()];
}

/**
 * Serializes an array of categories into a clean, comma-separated string
 * for database storage.
 */
export function serializeCategories(categories) {
  const parsed = parseCategories(categories);
  return parsed.join(", ");
}

/**
 * Formats categories for display with a custom separator (default: " • ").
 */
export function formatCategories(categoryField, separator = " • ") {
  const cats = parseCategories(categoryField);
  return cats.join(separator);
}

/**
 * Checks whether a template or category list includes a target category (case-insensitive).
 */
export function hasCategory(categoryFieldOrTemplate, targetCategory) {
  if (!categoryFieldOrTemplate || !targetCategory) return false;
  
  const raw =
    typeof categoryFieldOrTemplate === "object" && categoryFieldOrTemplate !== null
      ? categoryFieldOrTemplate.category
      : categoryFieldOrTemplate;

  const cats = parseCategories(raw);
  const target = targetCategory.trim().toLowerCase();
  return cats.some((c) => c.toLowerCase() === target);
}

/**
 * Checks whether a template is classified under Background Assets.
 */
export function isBackgroundAsset(categoryFieldOrTemplate) {
  return hasCategory(categoryFieldOrTemplate, BACKGROUND_CATEGORY);
}
