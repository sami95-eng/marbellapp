import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const projectRoot = path.resolve(__dirname, "..");

describe("VIP Access Screen", () => {
  const vipPath = path.join(projectRoot, "app/(tabs)/vip.tsx");
  const vipContent = fs.readFileSync(vipPath, "utf-8");

  it("should exist as a tab screen file", () => {
    expect(fs.existsSync(vipPath)).toBe(true);
  });

  it("should contain VIP_TABLES data with at least 5 entries", () => {
    const tableMatches = vipContent.match(/id:\s*"t\d+"/g);
    expect(tableMatches).not.toBeNull();
    expect(tableMatches!.length).toBeGreaterThanOrEqual(5);
  });

  it("should contain EVENT_DISCOUNTS data with at least 5 entries", () => {
    const discountMatches = vipContent.match(/id:\s*"d\d+"/g);
    expect(discountMatches).not.toBeNull();
    expect(discountMatches!.length).toBeGreaterThanOrEqual(5);
  });

  it("should contain MEMBER_OFFERS data with at least 5 entries", () => {
    const memberMatches = vipContent.match(/id:\s*"m\d+"/g);
    expect(memberMatches).not.toBeNull();
    expect(memberMatches!.length).toBeGreaterThanOrEqual(5);
  });

  it("should have three category tabs (tables, discounts, members)", () => {
    expect(vipContent).toContain('"tables"');
    expect(vipContent).toContain('"discounts"');
    expect(vipContent).toContain('"members"');
  });

  it("should include real Marbella venue names", () => {
    expect(vipContent).toContain("Ocean Club Marbella");
    expect(vipContent).toContain("Nikki Beach");
    expect(vipContent).toContain("Olivia Valere");
    expect(vipContent).toContain("Starlite Festival");
  });

  it("should include promo codes for discounts", () => {
    expect(vipContent).toContain("MARBELLVIP30");
    expect(vipContent).toContain("MOONVIP25");
    expect(vipContent).toContain("SKINAVIP20");
  });

  it("should include member tiers (gold, platinum, diamond)", () => {
    expect(vipContent).toContain('"gold"');
    expect(vipContent).toContain('"platinum"');
    expect(vipContent).toContain('"diamond"');
  });

  it("should have VIP pricing with original and VIP prices", () => {
    expect(vipContent).toContain("originalPrice");
    expect(vipContent).toContain("vipPrice");
  });

  it("should navigate to booking screen on table booking", () => {
    expect(vipContent).toContain('pathname: "/booking"');
  });
});

describe("Tab Navigation Layout", () => {
  const layoutPath = path.join(projectRoot, "app/(tabs)/_layout.tsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");

  it("should have 4 tab screens defined", () => {
    const tabScreens = layoutContent.match(/Tabs\.Screen/g);
    expect(tabScreens).not.toBeNull();
    expect(tabScreens!.length).toBe(4);
  });

  it("should include Home tab with house.fill icon", () => {
    expect(layoutContent).toContain('name="index"');
    expect(layoutContent).toContain('name="house.fill"');
  });

  it("should include VIP tab with crown.fill icon", () => {
    expect(layoutContent).toContain('name="vip"');
    expect(layoutContent).toContain('name="crown.fill"');
  });

  it("should include Bookings tab with bookmark.fill icon", () => {
    expect(layoutContent).toContain('name="bookings"');
    expect(layoutContent).toContain('name="bookmark.fill"');
  });

  it("should include Profile tab with person.fill icon", () => {
    expect(layoutContent).toContain('name="profile"');
    expect(layoutContent).toContain('name="person.fill"');
  });
});

describe("Tab Screen Files Exist", () => {
  it("should have index.tsx (Home) in tabs folder", () => {
    expect(fs.existsSync(path.join(projectRoot, "app/(tabs)/index.tsx"))).toBe(true);
  });

  it("should have vip.tsx in tabs folder", () => {
    expect(fs.existsSync(path.join(projectRoot, "app/(tabs)/vip.tsx"))).toBe(true);
  });

  it("should have bookings.tsx in tabs folder", () => {
    expect(fs.existsSync(path.join(projectRoot, "app/(tabs)/bookings.tsx"))).toBe(true);
  });

  it("should have profile.tsx in tabs folder", () => {
    expect(fs.existsSync(path.join(projectRoot, "app/(tabs)/profile.tsx"))).toBe(true);
  });
});

describe("Icon Symbol Mappings", () => {
  const iconPath = path.join(projectRoot, "components/ui/icon-symbol.tsx");
  const iconContent = fs.readFileSync(iconPath, "utf-8");

  it("should map crown.fill for VIP tab", () => {
    expect(iconContent).toContain('"crown.fill"');
  });

  it("should map bookmark.fill for Bookings tab", () => {
    expect(iconContent).toContain('"bookmark.fill"');
  });

  it("should map person.fill for Profile tab", () => {
    expect(iconContent).toContain('"person.fill"');
  });

  it("should map heart.fill for favorites", () => {
    expect(iconContent).toContain('"heart.fill"');
  });

  it("should map bell.fill for notifications", () => {
    expect(iconContent).toContain('"bell.fill"');
  });
});

describe("Bookings Tab Screen", () => {
  const bookingsPath = path.join(projectRoot, "app/(tabs)/bookings.tsx");
  const bookingsContent = fs.readFileSync(bookingsPath, "utf-8");

  it("should have booking data with real venue names", () => {
    expect(bookingsContent).toContain("Ocean Club Marbella");
    expect(bookingsContent).toContain("Nikki Beach Marbella");
  });

  it("should have status configuration for upcoming/completed/cancelled", () => {
    expect(bookingsContent).toContain("upcoming");
    expect(bookingsContent).toContain("completed");
    expect(bookingsContent).toContain("cancelled");
  });

  it("should use ScreenContainer for safe area", () => {
    expect(bookingsContent).toContain("ScreenContainer");
  });

  it("should use useColors hook for theming", () => {
    expect(bookingsContent).toContain("useColors");
  });
});

describe("Profile Tab Screen", () => {
  const profilePath = path.join(projectRoot, "app/(tabs)/profile.tsx");
  const profileContent = fs.readFileSync(profilePath, "utf-8");

  it("should display user stats", () => {
    expect(profileContent).toContain("Experiences");
    expect(profileContent).toContain("Photos");
    expect(profileContent).toContain("Followers");
  });

  it("should have menu items for navigation", () => {
    expect(profileContent).toContain("My Reservations");
    expect(profileContent).toContain("Favorites");
    expect(profileContent).toContain("Notifications");
    expect(profileContent).toContain("Settings");
  });

  it("should have membership badge display", () => {
    expect(profileContent).toContain("Gold Member");
  });

  it("should have sign out button", () => {
    expect(profileContent).toContain("Sign Out");
  });
});
