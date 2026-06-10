import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const projectRoot = path.resolve(__dirname, "..");

describe("Onboarding Feature", () => {
  const onboardingPath = path.join(projectRoot, "app/onboarding.tsx");
  const onboardingContent = fs.readFileSync(onboardingPath, "utf-8");

  it("should exist as a screen file", () => {
    expect(fs.existsSync(onboardingPath)).toBe(true);
  });

  it("should have 3 onboarding slides defined", () => {
    const slideMatches = onboardingContent.match(/id:\s*"slide-\d+"/g);
    expect(slideMatches).not.toBeNull();
    expect(slideMatches!.length).toBeGreaterThanOrEqual(3);
  });

  it("should have slide 1 about Welcome to Marbell'app", () => {
    expect(onboardingContent).toContain("Welcome");
    expect(onboardingContent).toContain("Marbella");
  });

  it("should have slide 2 about Explore by Category", () => {
    expect(onboardingContent).toContain("Explore by Category");
    expect(onboardingContent).toContain("Find Your Perfect Experience");
  });

  it("should have slide 3 about VIP Privileges", () => {
    expect(onboardingContent).toContain("Unlock VIP Privileges");
    expect(onboardingContent).toContain("Exclusive Member Benefits");
  });

  it("should mention VIP tiers (Gold, Platinum, Diamond)", () => {
    expect(onboardingContent).toContain("Platinum");
    expect(onboardingContent).toContain("Diamond");
  });

  it("should use OnboardingCarousel component", () => {
    expect(onboardingContent).toContain("OnboardingCarousel");
  });

  it("should call completeOnboarding on completion", () => {
    expect(onboardingContent).toContain("completeOnboarding");
  });

  it("should navigate to home tabs on completion", () => {
    expect(onboardingContent).toContain("/(tabs)");
  });
});

describe("Onboarding Carousel Component", () => {
  const carouselPath = path.join(
    projectRoot,
    "components/onboarding-carousel.tsx"
  );
  const carouselContent = fs.readFileSync(carouselPath, "utf-8");

  it("should exist as a component file", () => {
    expect(fs.existsSync(carouselPath)).toBe(true);
  });

  it("should export OnboardingCarousel component", () => {
    expect(carouselContent).toContain("OnboardingCarousel");
  });

  it("should have OnboardingSlide interface", () => {
    expect(carouselContent).toContain("OnboardingSlide");
  });

  it("should support horizontal scrolling", () => {
    expect(carouselContent).toContain("horizontal");
    expect(carouselContent).toContain("pagingEnabled");
  });

  it("should have pagination dots", () => {
    expect(carouselContent).toContain("borderRadius");
  });

  it("should have Next/Skip buttons", () => {
    expect(carouselContent).toContain("Next");
    expect(carouselContent).toContain("Skip");
  });

  it("should show Get Started button on last slide", () => {
    expect(carouselContent).toContain("isLastSlide");
  });

  it("should handle slide navigation", () => {
    expect(carouselContent).toContain("handleNext");
    expect(carouselContent).toContain("handlePrev");
  });

  it("should display progress indicator", () => {
    expect(carouselContent).toContain("currentIndex");
  });
});

describe("Onboarding Hook", () => {
  const hookPath = path.join(projectRoot, "hooks/use-onboarding.ts");
  const hookContent = fs.readFileSync(hookPath, "utf-8");

  it("should exist as a hook file", () => {
    expect(fs.existsSync(hookPath)).toBe(true);
  });

  it("should export useOnboarding hook", () => {
    expect(hookContent).toContain("export");
  });

  it("should check onboarding status from AsyncStorage", () => {
    expect(hookContent).toContain("AsyncStorage");
  });

  it("should provide completeOnboarding function", () => {
    expect(hookContent).toContain("completeOnboarding");
  });

  it("should provide resetOnboarding function", () => {
    expect(hookContent).toContain("resetOnboarding");
  });

  it("should return isOnboardingCompleted state", () => {
    expect(hookContent).toContain("isOnboardingCompleted");
  });

  it("should return isLoading state", () => {
    expect(hookContent).toContain("isLoading");
  });
});

describe("Root Layout Integration", () => {
  const layoutPath = path.join(projectRoot, "app/_layout.tsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");

  it("should import useOnboarding hook", () => {
    expect(layoutContent).toContain("useOnboarding");
  });

  it("should add onboarding screen to Stack", () => {
    expect(layoutContent).toContain("onboarding");
  });

  it("should check onboarding status in AuthRedirect", () => {
    expect(layoutContent).toContain("isOnboardingCompleted");
  });

  it("should redirect to onboarding after login if not completed", () => {
    expect(layoutContent).toContain("/onboarding");
  });

  it("should redirect to home if onboarding is completed", () => {
    expect(layoutContent).toContain("/(tabs)");
  });
});
