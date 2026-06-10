import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";

export default function ProfileScreen() {
  const router = useRouter();

  const stats = [
    { label: "Experiences", value: "12" },
    { label: "Photos Shared", value: "47" },
    { label: "Followers", value: "3.2K" },
  ];

  const badges = [
    { emoji: "🌟", name: "Explorer" },
    { emoji: "🎉", name: "Party Goer" },
    { emoji: "🍽️", name: "Foodie" },
    { emoji: "🏖️", name: "Beach Lover" },
  ];

  return (
    <ScreenContainer className="px-6">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-3xl font-bold text-foreground">Profile</Text>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            activeOpacity={0.6}
          >
            <Text className="text-2xl">⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View className="bg-surface rounded-2xl p-6 mb-6 border border-border items-center">
          <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-4">
            <Text className="text-6xl">👤</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">
            Sofia Martinez
          </Text>
          <Text className="text-sm text-muted mt-1">@sofia.marbella</Text>
          <Text className="text-xs text-muted mt-2 text-center">
            Travel & lifestyle creator | Marbella enthusiast
          </Text>
          <TouchableOpacity
            className="mt-4 bg-primary rounded-full px-6 py-2"
            activeOpacity={0.8}
          >
            <Text className="text-foreground font-bold text-sm">
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-6">
          {stats.map((stat, index) => (
            <View
              key={index}
              className="flex-1 bg-surface rounded-2xl p-4 border border-border items-center"
            >
              <Text className="text-2xl font-bold text-primary">
                {stat.value}
              </Text>
              <Text className="text-xs text-muted mt-1">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            Achievements
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {badges.map((badge, index) => (
              <View
                key={index}
                className="bg-surface rounded-2xl p-4 border border-border items-center w-24"
              >
                <Text className="text-3xl mb-1">{badge.emoji}</Text>
                <Text className="text-xs text-foreground text-center font-semibold">
                  {badge.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Portfolio */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            Recent Photos
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <View
                key={item}
                className="w-24 h-24 rounded-xl bg-primary items-center justify-center"
              >
                <Text className="text-3xl">📸</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Items */}
        <View className="gap-2 mb-8">
          <TouchableOpacity
            onPress={() => router.push("/my-reservations")}
            className="bg-surface rounded-2xl p-4 border border-border flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            <Text className="text-foreground font-semibold">My Reservations</Text>
            <Text className="text-muted">→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/favorites")}
            className="bg-surface rounded-2xl p-4 border border-border flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            <Text className="text-foreground font-semibold">❤️ Favorites</Text>
            <Text className="text-muted">→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            className="bg-surface rounded-2xl p-4 border border-border flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            <Text className="text-foreground font-semibold">🔔 Notifications</Text>
            <Text className="text-muted">→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-surface rounded-2xl p-4 border border-border flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            <Text className="text-foreground font-semibold">Help & Support</Text>
            <Text className="text-muted">→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-error rounded-2xl p-4 flex-row items-center justify-center"
            activeOpacity={0.8}
          >
            <Text className="text-background font-bold">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
