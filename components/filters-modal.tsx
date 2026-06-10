import { useState } from "react";
import { Modal, Text, View, TouchableOpacity, ScrollView } from "react-native";

export interface FilterOptions {
  priceRange: string[];
  minRating: number;
  sortBy: string;
  ambiance: string[];
}

const PRICE_OPTIONS = ["€", "€€", "€€€", "€€€€"];
const RATING_OPTIONS = [3, 3.5, 4, 4.5];
const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
];
const AMBIANCE_OPTIONS = [
  "Romantic",
  "Family",
  "Party",
  "Relaxed",
  "Exclusive",
  "Trendy",
  "Classic",
  "Beachfront",
];

interface FiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
}

export function FiltersModal({
  visible,
  onClose,
  onApply,
  initialFilters,
}: FiltersModalProps) {
  const [priceRange, setPriceRange] = useState<string[]>(
    initialFilters?.priceRange || []
  );
  const [minRating, setMinRating] = useState<number>(
    initialFilters?.minRating || 0
  );
  const [sortBy, setSortBy] = useState<string>(
    initialFilters?.sortBy || "popular"
  );
  const [ambiance, setAmbiance] = useState<string[]>(
    initialFilters?.ambiance || []
  );

  const togglePrice = (price: string) => {
    setPriceRange((prev) =>
      prev.includes(price) ? prev.filter((p) => p !== price) : [...prev, price]
    );
  };

  const toggleAmbiance = (item: string) => {
    setAmbiance((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const resetFilters = () => {
    setPriceRange([]);
    setMinRating(0);
    setSortBy("popular");
    setAmbiance([]);
  };

  const handleApply = () => {
    onApply({ priceRange, minRating, sortBy, ambiance });
    onClose();
  };

  const activeFiltersCount =
    priceRange.length +
    (minRating > 0 ? 1 : 0) +
    (sortBy !== "popular" ? 1 : 0) +
    ambiance.length;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-background/95">
        <View className="flex-1 mt-12 bg-background rounded-t-3xl border-t border-border">
          <ScrollView
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between p-6 border-b border-border">
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Text className="text-primary font-semibold">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-xl font-bold text-foreground">Filters</Text>
              <TouchableOpacity onPress={resetFilters} activeOpacity={0.7}>
                <Text className="text-muted font-semibold">Reset</Text>
              </TouchableOpacity>
            </View>

            {/* Price Range */}
            <View className="p-6 border-b border-border">
              <Text className="text-lg font-bold text-foreground mb-4">
                Price Range
              </Text>
              <View className="flex-row gap-3">
                {PRICE_OPTIONS.map((price) => (
                  <TouchableOpacity
                    key={price}
                    onPress={() => togglePrice(price)}
                    className={`flex-1 py-3 rounded-xl items-center border ${
                      priceRange.includes(price)
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`font-bold ${
                        priceRange.includes(price)
                          ? "text-background"
                          : "text-foreground"
                      }`}
                    >
                      {price}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Minimum Rating */}
            <View className="p-6 border-b border-border">
              <Text className="text-lg font-bold text-foreground mb-4">
                Minimum Rating
              </Text>
              <View className="flex-row gap-3">
                {RATING_OPTIONS.map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    onPress={() => setMinRating(minRating === rating ? 0 : rating)}
                    className={`flex-1 py-3 rounded-xl items-center border ${
                      minRating === rating
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`font-bold text-sm ${
                        minRating === rating
                          ? "text-background"
                          : "text-foreground"
                      }`}
                    >
                      ⭐ {rating}+
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort By */}
            <View className="p-6 border-b border-border">
              <Text className="text-lg font-bold text-foreground mb-4">
                Sort By
              </Text>
              <View className="gap-2">
                {SORT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setSortBy(option.value)}
                    className={`py-3 px-4 rounded-xl border ${
                      sortBy === option.value
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`font-semibold ${
                        sortBy === option.value
                          ? "text-background"
                          : "text-foreground"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Ambiance */}
            <View className="p-6">
              <Text className="text-lg font-bold text-foreground mb-4">
                Ambiance
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {AMBIANCE_OPTIONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => toggleAmbiance(item)}
                    className={`py-2 px-4 rounded-full border ${
                      ambiance.includes(item)
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        ambiance.includes(item)
                          ? "text-background"
                          : "text-foreground"
                      }`}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t border-border">
            <TouchableOpacity
              onPress={handleApply}
              className="bg-primary rounded-2xl py-4 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-background font-bold text-lg">
                Apply Filters{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
