import { View, Text, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { useColors } from "@/hooks/use-colors";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = "Loading..." }: LoadingOverlayProps) {
  const colors = useColors();
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset values
      spinValue.setValue(0);
      scaleValue.setValue(0.8);
      opacityValue.setValue(0);

      // Fade in
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Scale up
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      // Continuous rotation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      // Fade out
      Animated.timing(opacityValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, spinValue, scaleValue, opacityValue]);

  if (!visible) return null;

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 20, 25, 0.85)",
        justifyContent: "center",
        alignItems: "center",
        opacity: opacityValue,
        zIndex: 1000,
      }}
    >
      <View className="items-center gap-4">
        {/* Rotating Logo */}
        <Animated.View
          style={{
            transform: [
              { rotate: spin },
              { scale: scaleValue },
            ],
          }}
        >
          <View
            className="w-20 h-20 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-4xl">✨</Text>
          </View>
        </Animated.View>

        {/* Loading Text */}
        <Text className="text-primary font-bold text-lg">{message}</Text>

        {/* Animated Dots */}
        <View className="flex-row gap-2">
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.primary,
                opacity: spinValue.interpolate({
                  inputRange: [0, 0.33, 0.66, 1],
                  outputRange: [
                    index === 0 ? 1 : 0.3,
                    index === 1 ? 1 : 0.3,
                    index === 2 ? 1 : 0.3,
                    index === 0 ? 1 : 0.3,
                  ],
                }),
              }}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}
