import React, { useRef, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Text,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useColors } from "@/hooks/use-colors";

const { width: screenWidth } = Dimensions.get("window");

export interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  backgroundColor?: string;
  accentColor?: string;
}

interface OnboardingCarouselProps {
  slides: OnboardingSlide[];
  onComplete: () => void;
  onSkip?: () => void;
}

export function OnboardingCarousel({
  slides,
  onComplete,
  onSkip,
}: OnboardingCarouselProps) {
  const colors = useColors();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const currentIndex = Math.round(contentOffsetX / screenWidth);
      setCurrentIndex(currentIndex);
    },
    []
  );

  const handleNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * screenWidth,
        animated: true,
      });
    } else {
      onComplete();
    }
  }, [currentIndex, slides.length, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex - 1) * screenWidth,
        animated: true,
      });
    }
  }, [currentIndex]);

  const handleDotPress = useCallback((index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * screenWidth,
      animated: true,
    });
  }, []);

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ScrollView for slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        style={{ flex: 1 }}
      >
        {slides.map((slide) => (
          <View
            key={slide.id}
            style={{
              width: screenWidth,
              flex: 1,
              backgroundColor: slide.backgroundColor || colors.background,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 24,
            }}
          >
            {/* Icon/Emoji */}
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: slide.accentColor
                  ? `${slide.accentColor}20`
                  : "rgba(212,175,55,0.15)",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 32,
              }}
            >
              <Text style={{ fontSize: 64 }}>{slide.icon}</Text>
            </View>

            {/* Title */}
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: colors.foreground,
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              {slide.title}
            </Text>

            {/* Subtitle */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: slide.accentColor || colors.primary,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {slide.subtitle}
            </Text>

            {/* Description */}
            <Text
              style={{
                fontSize: 14,
                color: colors.muted,
                textAlign: "center",
                lineHeight: 22,
                marginBottom: 40,
              }}
            >
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots & Navigation */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 32,
          paddingTop: 16,
          backgroundColor: colors.background,
        }}
      >
        {/* Dots */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            marginBottom: 24,
          }}
        >
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
              activeOpacity={0.7}
              style={{
                width: currentIndex === index ? 32 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  currentIndex === index ? colors.primary : colors.border,
              }}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          {/* Skip Button (only on first two slides) */}
          {!isLastSlide && (
            <TouchableOpacity
              onPress={onSkip}
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: colors.muted,
                }}
              >
                Skip
              </Text>
            </TouchableOpacity>
          )}

          {/* Previous Button */}
          {currentIndex > 0 && (
            <TouchableOpacity
              onPress={handlePrev}
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: colors.muted,
                }}
              >
                Back
              </Text>
            </TouchableOpacity>
          )}

          {/* Next/Complete Button */}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.7}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: colors.primary,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#0A0E13",
              }}
            >
              {isLastSlide ? "Get Started" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Text */}
        <Text
          style={{
            fontSize: 12,
            color: colors.muted,
            textAlign: "center",
            marginTop: 12,
          }}
        >
          {currentIndex + 1} of {slides.length}
        </Text>
      </View>
    </View>
  );
}
