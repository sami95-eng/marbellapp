import { useState, useRef, useCallback } from "react";
import { View, Text, Dimensions, FlatList, ViewToken } from "react-native";
import { Image } from "expo-image";

interface ImageCarouselProps {
  images: { uri: any; caption?: string }[];
  height?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function ImageCarousel({ images, height = 280 }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = ({ item }: { item: { uri: any; caption?: string } }) => (
    <View style={{ width: SCREEN_WIDTH, height }}>
      <Image
        source={typeof item.uri === "string" ? { uri: item.uri } : item.uri}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        transition={300}
      />
      {item.caption && (
        <View className="absolute bottom-0 left-0 right-0 p-3 bg-black/40">
          <Text className="text-white text-sm font-medium">{item.caption}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ height }}>
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
      />
      {/* Pagination Dots */}
      {images.length > 1 && (
        <View className="absolute bottom-3 left-0 right-0 flex-row justify-center items-center">
          {images.map((_, index) => (
            <View
              key={index}
              className={`mx-1 rounded-full ${
                index === activeIndex
                  ? "bg-primary w-6 h-2"
                  : "bg-white/60 w-2 h-2"
              }`}
            />
          ))}
        </View>
      )}
      {/* Image Counter */}
      <View className="absolute top-3 right-3 bg-black/50 px-2 py-1 rounded-full">
        <Text className="text-white text-xs font-medium">
          {activeIndex + 1}/{images.length}
        </Text>
      </View>
    </View>
  );
}
