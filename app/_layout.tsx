import "@/global.css";
import React from "react";
import "@/lib/i18n"; // initialise i18next before any screen renders
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform, View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { loadSavedLanguage } from "@/lib/i18n";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { FavoritesProvider } from "@/lib/favorites-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import { useOnboarding } from "@/hooks/use-onboarding";
import { DemoProvider, useDemo } from "@/lib/demo-context";
import { consumePartnerLoginIntent } from "@/lib/login-intent";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] caught:", error.message, info.componentStack?.slice(0, 300));
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0a0a0f", padding: 32 }}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>⚠️</Text>
          <Text style={{ color: "#D4AF37", fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 8 }}>
            Une erreur est survenue
          </Text>
          <Text style={{ color: "#888", fontSize: 13, textAlign: "center", marginBottom: 28 }}>
            L'app a rencontré un problème inattendu.
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false })}
            style={{ backgroundColor: "#D4AF37", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50 }}
          >
            <Text style={{ color: "#0a0a0f", fontWeight: "800", fontSize: 15 }}>Recharger</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

const SPLASH_MAX_WAIT_MS = 4000;
const SPLASH_MIN_MS = 2500;

export const unstable_settings = {
  anchor: "(tabs)",
};

function AuthRedirect() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [splashDone, setSplashDone] = useState(false);
  const { isOnboardingCompleted, isLoading: onboardingLoading } = useOnboarding();
  const hardDeadlineFired = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hardDeadlineFired.current) {
        hardDeadlineFired.current = true;
        setSplashDone(true);
      }
    }, SPLASH_MAX_WAIT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!splashDone) return;

    const stillLoading = (loading || onboardingLoading) && !hardDeadlineFired.current;
    if (stillLoading) return;

    const inAuthGroup    = segments[0] === "(tabs)";
    const inLoginOrSplash = segments[0] === "login" || segments[0] === "splash" || segments[0] === "login-email" || segments[0] === "login-phone";
    const inOnboarding   = segments[0] === "onboarding";
    const inVerifyEmail  = segments[0] === "verify-email";

    console.log("[AuthRedirect] seg=", segments[0], "auth=", isAuthenticated, "loading=", loading);

    if (isAuthenticated) {
      // Already on a public screen → send to app
      if (inLoginOrSplash || inVerifyEmail) {
        // Connexion via l'onglet "Établissement" → dashboard partenaire (déterministe)
        if (consumePartnerLoginIntent()) {
          router.replace("/partner-dashboard");
        } else {
          router.replace(isOnboardingCompleted ? "/(tabs)" : "/onboarding");
        }
      } else if (inOnboarding && isOnboardingCompleted) {
        router.replace("/(tabs)");
      }
    } else {
      // Not authenticated: only redirect away from the protected tab area.
      // Explicitly allow login/splash/onboarding screens — never bounce from them.
      if (inAuthGroup) {
        router.replace("/login");
      }
      // If already on login/splash → do nothing (prevents bounce-back after logout)
    }
  }, [
    loading,
    isAuthenticated,
    splashDone,
    onboardingLoading,
    isOnboardingCompleted,
    segments,
    router,
  ]);

  return null;
}

function DemoBanner() {
  const { isDemoMode } = useDemo();
  if (!isDemoMode) return null;
  return (
    <View style={{
      position: "absolute", top: 0, left: 0, right: 0, zIndex: 9999,
      backgroundColor: "transparent", alignItems: "center",
      paddingTop: Platform.OS === "ios" ? 54 : 12,
      pointerEvents: "none",
    }}>
      <View style={{
        backgroundColor: "rgba(212,175,55,0.95)",
        paddingHorizontal: 14, paddingVertical: 4,
        borderRadius: 20,
        shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
      }}>
        <Text style={{ fontSize: 10, fontWeight: "800", color: "#0A0E13", letterSpacing: 1.5 }}>
          ✨ DEMO MODE
        </Text>
      </View>
    </View>
  );
}

function RootLayoutInner() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  useEffect(() => {
    initManusRuntime();
    loadSavedLanguage(); // restore persisted language preference
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: 1 },
        },
      })
  );
  const [trpcClient] = useState(() => createTRPCClient());

  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <DemoProvider>
            <FavoritesProvider>
              <NotificationsProvider>
                <DemoBanner />
                <AuthRedirect />
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "slide_from_right",
                  animationDuration: 320,
                }}
                initialRouteName="splash"
              >
                <Stack.Screen name="splash" options={{ animation: "fade" }} />
                <Stack.Screen name="login" options={{ animation: "fade" }} />
                <Stack.Screen name="login-email" options={{ animation: "slide_from_bottom" }} />
                <Stack.Screen name="login-phone" options={{ animation: "slide_from_bottom" }} />
                <Stack.Screen name="verify-email" options={{ animation: "slide_from_bottom" }} />
                <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
                <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
                <Stack.Screen name="oauth/callback" options={{ animation: "fade" }} />
                <Stack.Screen name="venues" />
                <Stack.Screen name="venue-detail" />
                <Stack.Screen name="booking" />
                <Stack.Screen name="booking-confirmation" />
                <Stack.Screen name="booking-detail" />
                <Stack.Screen name="my-reservations" />
                <Stack.Screen name="my-bookings" />
                <Stack.Screen name="map" />
                <Stack.Screen name="settings" options={{ animation: "slide_from_bottom" }} />
                <Stack.Screen name="favorites" />
                <Stack.Screen name="notifications" options={{ animation: "slide_from_bottom" }} />
                <Stack.Screen name="vip-qr" options={{ animation: "slide_from_bottom" }} />
                <Stack.Screen name="edit-profile" options={{ animation: "slide_from_bottom" }} />
                <Stack.Screen name="partner-dashboard" />
                <Stack.Screen name="join-partner" />
                <Stack.Screen name="privacy" options={{ animation: "slide_from_bottom" }} />
                <Stack.Screen name="terms" options={{ animation: "slide_from_bottom" }} />
              </Stack>
                <StatusBar style="light" />
              </NotificationsProvider>
            </FavoritesProvider>
          </DemoProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );

  if (Platform.OS === "web") {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return <RootLayoutInner />;
}
