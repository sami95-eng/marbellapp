import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import {
  OnboardingCarousel,
  type OnboardingSlide,
} from "@/components/onboarding-carousel";
import { useCallback } from "react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useTranslation } from "react-i18next";

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();

  const ONBOARDING_SLIDES: OnboardingSlide[] = [
    {
      id: "slide-1",
      title: t("onboarding.slide1.title"),
      subtitle: t("onboarding.slide1.subtitle"),
      description: t("onboarding.slide1.desc"),
      icon: "🌟",
      backgroundColor: "#0A0E13",
      accentColor: "#D4AF37",
    },
    {
      id: "slide-2",
      title: t("onboarding.slide2.title"),
      subtitle: t("onboarding.slide2.subtitle"),
      description: t("onboarding.slide2.desc"),
      icon: "🗺️",
      backgroundColor: "#0A0E13",
      accentColor: "#1ABC9C",
    },
    {
      id: "slide-3",
      title: t("onboarding.slide3.title"),
      subtitle: t("onboarding.slide3.subtitle"),
      description: t("onboarding.slide3.desc"),
      icon: "👑",
      backgroundColor: "#0A0E13",
      accentColor: "#D4AF37",
    },
  ];

  const handleComplete = useCallback(async () => {
    await completeOnboarding();
    router.replace("/(tabs)");
  }, [router, completeOnboarding]);

  const handleSkip = useCallback(async () => {
    await completeOnboarding();
    router.replace("/(tabs)");
  }, [router, completeOnboarding]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      <OnboardingCarousel
        slides={ONBOARDING_SLIDES}
        onComplete={handleComplete}
        onSkip={handleSkip}
      />
    </ScreenContainer>
  );
}
