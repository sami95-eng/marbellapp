// Accent couleur distinctif par catégorie de lieu.
//
// L'or (#D4AF37) reste la signature rare de la marque ; ces teintes servent
// uniquement à la *catégorisation* (icônes/chips de catégorie) — un usage
// fonctionnel assumé (cf. colorize : "Categorization: different types"),
// distinct de l'accent or. Toutes sont vives sur fond sombre (#0A0E13 /
// surface #141A22) → contraste ≥ 3:1 pour des icônes/labels.

export const CATEGORY_COLORS = {
  beachClub:  "#2DD4BF", // turquoise — la mer
  fineDining: "#FB923C", // orange chaud — gastronomie
  spa:        "#34D399", // menthe — bien-être
  nightlife:  "#A78BFA", // violet — club
  events:     "#F472B6", // rose — célébration
  water:      "#38BDF8", // bleu ciel — sports nautiques
  shopping:   "#F0ABFC", // magenta clair — shopping
  hotel:      "#FBBF24", // ambre — hôtellerie
  default:    "#9CA3AF", // neutre (muted)
} as const;

/** Couleur par identifiant de catégorie (accueil — CATEGORIES[].id). */
export function categoryColorById(id: string): string {
  switch (id) {
    case "beach-clubs": return CATEGORY_COLORS.beachClub;
    case "fine-dining": return CATEGORY_COLORS.fineDining;
    case "spas":        return CATEGORY_COLORS.spa;
    case "nightlife":   return CATEGORY_COLORS.nightlife;
    case "events":      return CATEGORY_COLORS.events;
    case "shopping":    return CATEGORY_COLORS.water; // "Water Activities"
    default:            return CATEGORY_COLORS.default;
  }
}

/** Couleur par nom de catégorie affiché (fiche lieu — venue.category). */
export function categoryColorByName(name: string): string {
  switch (name) {
    case "Beach Club":     return CATEGORY_COLORS.beachClub;
    case "Fine Dining":    return CATEGORY_COLORS.fineDining;
    case "Spa & Wellness": return CATEGORY_COLORS.spa;
    case "Nightlife":      return CATEGORY_COLORS.nightlife;
    case "Events":         return CATEGORY_COLORS.events;
    case "Shopping":       return CATEGORY_COLORS.shopping;
    case "Hotel":          return CATEGORY_COLORS.hotel;
    default:               return CATEGORY_COLORS.default;
  }
}
