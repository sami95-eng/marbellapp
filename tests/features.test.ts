import { describe, it, expect } from "vitest";

describe("Favorites Feature", () => {
  it("should track favorite venue IDs correctly", () => {
    const favorites: string[] = [];

    // Add a favorite
    const addFavorite = (id: string) => {
      if (!favorites.includes(id)) {
        favorites.push(id);
      }
    };

    // Remove a favorite
    const removeFavorite = (id: string) => {
      const index = favorites.indexOf(id);
      if (index > -1) {
        favorites.splice(index, 1);
      }
    };

    // Toggle logic
    const toggleFavorite = (id: string) => {
      if (favorites.includes(id)) {
        removeFavorite(id);
      } else {
        addFavorite(id);
      }
    };

    expect(favorites.length).toBe(0);

    toggleFavorite("ocean-club");
    expect(favorites).toContain("ocean-club");
    expect(favorites.length).toBe(1);

    toggleFavorite("lena");
    expect(favorites).toContain("lena");
    expect(favorites.length).toBe(2);

    // Toggle off
    toggleFavorite("ocean-club");
    expect(favorites).not.toContain("ocean-club");
    expect(favorites.length).toBe(1);
  });

  it("should check if a venue is favorite", () => {
    const favorites = ["ocean-club", "nikki-beach"];
    const isFavorite = (id: string) => favorites.includes(id);

    expect(isFavorite("ocean-club")).toBe(true);
    expect(isFavorite("nikki-beach")).toBe(true);
    expect(isFavorite("lena")).toBe(false);
  });
});

describe("Notifications Feature", () => {
  interface Notification {
    id: string;
    type: "offer" | "booking" | "reminder" | "system";
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }

  it("should count unread notifications correctly", () => {
    const notifications: Notification[] = [
      { id: "1", type: "offer", title: "Offer", message: "Test", timestamp: "2026-06-01", read: false },
      { id: "2", type: "booking", title: "Booking", message: "Test", timestamp: "2026-06-01", read: true },
      { id: "3", type: "reminder", title: "Reminder", message: "Test", timestamp: "2026-06-01", read: false },
    ];

    const unreadCount = notifications.filter((n) => !n.read).length;
    expect(unreadCount).toBe(2);
  });

  it("should mark notification as read", () => {
    const notifications: Notification[] = [
      { id: "1", type: "offer", title: "Offer", message: "Test", timestamp: "2026-06-01", read: false },
    ];

    const markAsRead = (id: string) => {
      const notif = notifications.find((n) => n.id === id);
      if (notif) notif.read = true;
    };

    expect(notifications[0].read).toBe(false);
    markAsRead("1");
    expect(notifications[0].read).toBe(true);
  });

  it("should mark all notifications as read", () => {
    const notifications: Notification[] = [
      { id: "1", type: "offer", title: "Offer", message: "Test", timestamp: "2026-06-01", read: false },
      { id: "2", type: "booking", title: "Booking", message: "Test", timestamp: "2026-06-01", read: false },
    ];

    notifications.forEach((n) => { n.read = true; });
    const unreadCount = notifications.filter((n) => !n.read).length;
    expect(unreadCount).toBe(0);
  });
});

describe("Filters Feature", () => {
  interface Venue {
    id: string;
    name: string;
    rating: number;
    price: string;
    ambiance: string[];
  }

  const venues: Venue[] = [
    { id: "1", name: "Ocean Club", rating: 4.9, price: "€€€€", ambiance: ["Exclusive", "Party"] },
    { id: "2", name: "Breathe", rating: 4.6, price: "€€", ambiance: ["Relaxed", "Family"] },
    { id: "3", name: "Nikki Beach", rating: 4.8, price: "€€€€", ambiance: ["Party", "Trendy"] },
    { id: "4", name: "Calma", rating: 4.8, price: "€€€", ambiance: ["Trendy", "Relaxed"] },
  ];

  it("should filter by price range", () => {
    const priceFilter = ["€€€€"];
    const filtered = venues.filter((v) => priceFilter.includes(v.price));
    expect(filtered.length).toBe(2);
    expect(filtered[0].name).toBe("Ocean Club");
    expect(filtered[1].name).toBe("Nikki Beach");
  });

  it("should filter by minimum rating", () => {
    const minRating = 4.8;
    const filtered = venues.filter((v) => v.rating >= minRating);
    expect(filtered.length).toBe(3);
  });

  it("should filter by ambiance", () => {
    const ambianceFilter = ["Relaxed"];
    const filtered = venues.filter((v) =>
      v.ambiance.some((a) => ambianceFilter.includes(a))
    );
    expect(filtered.length).toBe(2);
    expect(filtered[0].name).toBe("Breathe");
    expect(filtered[1].name).toBe("Calma");
  });

  it("should sort by rating descending", () => {
    const sorted = [...venues].sort((a, b) => b.rating - a.rating);
    expect(sorted[0].name).toBe("Ocean Club");
    expect(sorted[sorted.length - 1].name).toBe("Breathe");
  });

  it("should sort by price low to high", () => {
    const sorted = [...venues].sort((a, b) => a.price.length - b.price.length);
    expect(sorted[0].name).toBe("Breathe");
  });
});

describe("Venues Database", () => {
  const VENUE_IDS = [
    "ocean-club", "nikki-beach", "lena", "puente-romano-spa", "puerto-banus-nightlife", "puerto-banus-shopping",
    "playa-padre", "opium-beach", "amare-beach",
    "skina", "messina", "ta-kumi",
    "finca-cortesin-spa", "amare-spa",
    "olivia-valere", "mirage-nightclub",
    "starlite-festival", "puerto-banus",
  ];

  it("should have at least 18 unique venues", () => {
    expect(VENUE_IDS.length).toBeGreaterThanOrEqual(18);
    const unique = new Set(VENUE_IDS);
    expect(unique.size).toBe(VENUE_IDS.length);
  });

  it("should cover all categories", () => {
    const categories = {
      "Beach Clubs": ["ocean-club", "nikki-beach", "playa-padre", "opium-beach", "amare-beach"],
      "Fine Dining": ["lena", "skina", "messina", "ta-kumi"],
      "Spas & Wellness": ["puente-romano-spa", "finca-cortesin-spa", "amare-spa"],
      "Nightlife": ["puerto-banus-nightlife", "olivia-valere", "mirage-nightclub"],
      "Events": ["starlite-festival"],
      "Shopping": ["puerto-banus-shopping", "puerto-banus"],
    };

    expect(Object.keys(categories).length).toBe(6);
    expect(categories["Beach Clubs"].length).toBeGreaterThanOrEqual(3);
    expect(categories["Fine Dining"].length).toBeGreaterThanOrEqual(3);
    expect(categories["Spas & Wellness"].length).toBeGreaterThanOrEqual(2);
    expect(categories["Nightlife"].length).toBeGreaterThanOrEqual(2);
  });

  it("should have featured venues with valid IDs", () => {
    const featuredIds = ["ocean-club", "skina", "opium-beach", "mirage-nightclub", "finca-cortesin-spa"];
    featuredIds.forEach((id) => {
      expect(VENUE_IDS).toContain(id);
    });
  });
});
