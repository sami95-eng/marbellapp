import { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export default function SplashScreen() {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoScale, logoOpacity, textOpacity]);

  return (
    <ScreenContainer className="items-center justify-center">
      <View className="items-center gap-6">
        {/* Animated Logo */}
        <Animated.View
          style={{
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          }}
        >
          <Text style={{ fontSize: 80 }}>✨</Text>
        </Animated.View>

        {/* Animated Text */}
        <Animated.View style={{ opacity: textOpacity }}>
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-primary">Marbell'app</Text>
            <Text className="text-lg font-medium text-muted">Exclusive Experiences in Marbella</Text>
          </View>
        </Animated.View>

        {/* Loading Dots */}
        <View className="mt-10">
          <LoadingDots />
        </View>
      </View>
    </ScreenContainer>
  );
}

function LoadingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createDotAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
    };

    Animated.parallel([
      createDotAnimation(dot1, 0),
      createDotAnimation(dot2, 200),
      createDotAnimation(dot3, 400),
    ]).start();
  }, [dot1, dot2, dot3]);

  return (
    <View className="flex-row gap-2 items-center justify-center">
      <Animated.View style={{ opacity: dot1 }}>
        <View className="w-3 h-3 rounded-full bg-primary" />
      </Animated.View>
      <Animated.View style={{ opacity: dot2 }}>
        <View className="w-3 h-3 rounded-full bg-primary" />
      </Animated.View>
      <Animated.View style={{ opacity: dot3 }}>
        <View className="w-3 h-3 rounded-full bg-primary" />
      </Animated.View>
    </View>
  );
}
