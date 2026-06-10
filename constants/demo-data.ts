// ─────────────────────────────────────────────────────────────────────────────
// Demo data — Ocean Club Marbella partner account
// Used when isDemoMode = true
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_PARTNER = {
  name:            "Ocean Club Marbella",
  handle:          "@oceanclubmarbella",
  slug:            "ocean-club",
  category:        "Beach Club",
  address:         "Playa de la Fontanilla s/n, Puerto Banús",
  phone:           "+34 952 81 82 82",
  website:         "oceanclubmarbella.com",
  instagramHandle: "@oceanclubmarbella",
  rating:          4.9,
  reviewsCount:    2847,
  coverImage:      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
  isPartner:       true,
};

// ── Réservations ─────────────────────────────────────────────────────────────
export const DEMO_RESERVATIONS = [
  { id: "r1",  guest: "Sofia M.",    date: "Sat 7 Jun",  time: "22:00", type: "VIP Cabana",       status: "confirmed", guests: 4 },
  { id: "r2",  guest: "Carlos R.",   date: "Sun 8 Jun",  time: "14:00", type: "Daybed Premium",   status: "pending",   guests: 2 },
  { id: "r3",  guest: "Laura T.",    date: "Sat 7 Jun",  time: "20:00", type: "VIP Table",        status: "confirmed", guests: 6 },
  { id: "r4",  guest: "Marco A.",    date: "Mon 9 Jun",  time: "21:00", type: "Private Booth",    status: "cancelled", guests: 3 },
  { id: "r5",  guest: "Elena V.",    date: "Fri 6 Jun",  time: "19:00", type: "VIP Cabana",       status: "confirmed", guests: 8 },
  { id: "r6",  guest: "James B.",    date: "Thu 5 Jun",  time: "23:00", type: "Pool Table",       status: "confirmed", guests: 5 },
  { id: "r7",  guest: "Natasha K.",  date: "Wed 4 Jun",  time: "18:00", type: "Sunset Daybed",    status: "confirmed", guests: 2 },
  { id: "r8",  guest: "Pablo S.",    date: "Tue 3 Jun",  time: "20:30", type: "VIP Lounge",       status: "confirmed", guests: 10 },
];

// ── Bookings utilisateur (onglet Bookings — shape Booking) ───────────────────
export const DEMO_BOOKINGS = [
  {
    id: "b1", user_id: "demo", venue_id: null,
    venue_name: "Ocean Club Marbella", venue_slug: "ocean-club-marbella", venue_category: "Beach Club",
    date: "2026-06-15", time: "20:00", guests: 4,
    table_id: null, table_name: "VIP Cabana", table_price: 1200,
    notes: null, status: "confirmed", confirmation_number: "MSS-DEMO01",
    created_at: new Date().toISOString(),
  },
  {
    id: "b2", user_id: "demo", venue_id: null,
    venue_name: "Leña by Dani García", venue_slug: "lena-dani-garcia", venue_category: "Fine Dining",
    date: "2026-06-20", time: "21:00", guests: 2,
    table_id: null, table_name: null, table_price: null,
    notes: "Anniversaire", status: "confirmed", confirmation_number: "MSS-DEMO02",
    created_at: new Date().toISOString(),
  },
  {
    id: "b3", user_id: "demo", venue_id: null,
    venue_name: "Nikki Beach Marbella", venue_slug: "nikki-beach-marbella", venue_category: "Beach Club",
    date: "2026-05-20", time: "14:00", guests: 6,
    table_id: null, table_name: "White Cabana VIP", table_price: 1500,
    notes: null, status: "completed", confirmation_number: "MSS-DEMO03",
    created_at: new Date().toISOString(),
  },
  {
    id: "b4", user_id: "demo", venue_id: null,
    venue_name: "Olivia Valere", venue_slug: "olivia-valere", venue_category: "Nightlife",
    date: "2026-05-10", time: "23:30", guests: 5,
    table_id: null, table_name: "VIP Booth", table_price: 3000,
    notes: null, status: "cancelled", confirmation_number: "MSS-DEMO04",
    created_at: new Date().toISOString(),
  },
];

// ── Offres VIP actives ────────────────────────────────────────────────────────
export const DEMO_VIP_OFFERS = [
  {
    id: "o1",
    title:         "VIP Cabana Weekend",
    type:          "table" as const,
    image:         "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600",
    originalPrice: 2000,
    vipPrice:      1200,
    spotsTotal:    5,
    spotsLeft:     2,
    capacity:      8,
    date:          "Sat, Jun 7",
    time:          "22:00 – 04:00",
    tag:           "HOT",
    perks:         ["2 Premium Bottles", "Dedicated Server", "Pool Access"],
    active:        true,
  },
  {
    id: "o2",
    title:         "Daybed Premium",
    type:          "bed" as const,
    image:         "https://images.unsplash.com/photo-1548438294-1ad5d5f4f063?w=600",
    originalPrice: 800,
    vipPrice:      500,
    spotsTotal:    10,
    spotsLeft:     6,
    capacity:      4,
    date:          "Sun, Jun 8",
    time:          "13:00 – 20:00",
    tag:           "BEST VALUE",
    perks:         ["1 Bottle Rosé", "Towel Service", "Food Menu Access"],
    active:        true,
  },
  {
    id: "o3",
    title:         "Sunset Pool Experience",
    type:          "table" as const,
    image:         "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600",
    originalPrice: 1200,
    vipPrice:      750,
    spotsTotal:    8,
    spotsLeft:     4,
    capacity:      6,
    date:          "Fri, Jun 6",
    time:          "19:00 – 23:00",
    tag:           "POPULAR",
    perks:         ["1 Premium Bottle", "Sunset View", "Priority Access"],
    active:        true,
  },
  {
    id: "o4",
    title:         "Welcome Bottle Package",
    type:          "bottle" as const,
    image:         "https://images.unsplash.com/photo-1548250531-94d59f8d5e71?w=600",
    originalPrice: 350,
    vipPrice:      0,
    spotsTotal:    20,
    spotsLeft:     0,
    capacity:      2,
    date:          "Any day",
    time:          "Any time",
    tag:           "SOLD OUT",
    perks:         ["1 Welcome Bottle", "Priority Entry"],
    active:        false,
  },
];

// ── Métriques du dashboard ────────────────────────────────────────────────────
export const DEMO_METRICS = {
  bookingsThisMonth: { value: "47",    trend: "+12%",  icon: "📋" },
  vipRevenue:        { value: "€18.4K", trend: "+24%",  icon: "💰" },
  instagramPosts:    { value: "23",    trend: "+5",    icon: "📸" },
  avgRating:         { value: "4.9",   trend: "stable", icon: "⭐" },
};

// ── Activité récente ──────────────────────────────────────────────────────────
export const DEMO_ACTIVITY = [
  { msg: "New VIP Cabana booking — Sofia M.",        time: "2 hours ago",  icon: "📋" },
  { msg: "Instagram post validated — @sofia.marbella", time: "4 hours ago",  icon: "📸" },
  { msg: "Payment received — €1,200",                time: "Yesterday",    icon: "💰" },
  { msg: "Daybed Premium offer activated",           time: "Yesterday",    icon: "👑" },
  { msg: "New 5-star review — Carlos R.",            time: "2 days ago",   icon: "⭐" },
];

// ── Graphique mensuel ─────────────────────────────────────────────────────────
export const DEMO_MONTHLY = {
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  values: [18,    24,    20,    32,    38,    47],
};

// ── Top offres stats ──────────────────────────────────────────────────────────
export const DEMO_TOP_OFFERS = [
  { name: "VIP Cabana Weekend",   bookings: 18, revenue: "€21,600" },
  { name: "Daybed Premium",       bookings: 12, revenue: "€6,000" },
  { name: "Sunset Pool Exp.",     bookings: 9,  revenue: "€6,750" },
  { name: "Welcome Bottle Pkg.",  bookings: 8,  revenue: "€2,800" },
];

// ── Tables démo (Ocean Club) ─────────────────────────────────────────────────
export const DEMO_TABLES = [
  {
    id: "dt1",
    venue_id: "demo-venue",
    name: "VIP Cabana",
    description: "Premium beachside cabana with dedicated service, private pool access and 2 premium bottles included.",
    capacity_min: 4,
    capacity_max: 10,
    price_min: 1200,
    price_max: 2500,
    photo_url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
    is_active: true,
    is_vip: true,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "dt2",
    venue_id: "demo-venue",
    name: "Beachfront Table",
    description: "First-row table on the sand with panoramic Mediterranean views and priority waiter service.",
    capacity_min: 2,
    capacity_max: 6,
    price_min: 500,
    price_max: 1200,
    photo_url: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80",
    is_active: true,
    is_vip: true,
    sort_order: 2,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "dt3",
    venue_id: "demo-venue",
    name: "Pool Daybed",
    description: "Exclusive premium daybed alongside the main pool. Ideal for relaxation with full bottle service.",
    capacity_min: 2,
    capacity_max: 4,
    price_min: 300,
    price_max: 600,
    photo_url: "https://images.unsplash.com/photo-1573843981267-be1480dcd4fc?auto=format&fit=crop&w=800&q=80",
    is_active: true,
    is_vip: false,
    sort_order: 3,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "dt4",
    venue_id: "demo-venue",
    name: "Rooftop Lounge",
    description: "Elevated terrace with 360° Mediterranean views. Perfect for sunset cocktails and evening dining.",
    capacity_min: 2,
    capacity_max: 8,
    price_min: 400,
    price_max: 900,
    photo_url: "https://images.unsplash.com/photo-1566073771259-b4ad8b8f0517?auto=format&fit=crop&w=800&q=80",
    is_active: true,
    is_vip: true,
    sort_order: 4,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "dt5",
    venue_id: "demo-venue",
    name: "Standard Beach Table",
    description: "Classic beach table with full waiter service. Best value option for groups up to 6.",
    capacity_min: 2,
    capacity_max: 6,
    price_min: 150,
    price_max: 400,
    photo_url: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=800&q=80",
    is_active: true,
    is_vip: false,
    sort_order: 5,
    created_at: "2026-01-01T00:00:00Z",
  },
];

// ── QR code démo ──────────────────────────────────────────────────────────────
export const DEMO_QR = {
  offerId:         "demo-vip-001",
  offerTitle:      "VIP Cabana Weekend",
  venue:           "Ocean Club Marbella",
  date:            "Sat, Jun 7 · 22:00",
  type:            "table",
  instagramHandle: "@oceanclubmarbella",
  requirement:     "Follow @oceanclubmarbella + post a story or reel the same evening",
};
