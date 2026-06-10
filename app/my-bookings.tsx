import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";

interface Booking {
  id: string;
  venueId: string;
  venueName: string;
  date: string;
  time: string;
  guests: number;
  status: "upcoming" | "completed" | "cancelled";
  image: string;
}

const BOOKINGS: Booking[] = [
  {
    id: "1",
    venueId: "1",
    venueName: "Ocean Club Marbella",
    date: "2026-05-30",
    time: "19:00",
    guests: 2,
    status: "upcoming",
    image: "🌊",
  },
  {
    id: "2",
    venueId: "4",
    venueName: "Leña by Dani García",
    date: "2026-06-05",
    time: "20:30",
    guests: 4,
    status: "upcoming",
    image: "🔥",
  },
  {
    id: "3",
    venueId: "2",
    venueName: "La Sala by the Sea",
    date: "2026-05-15",
    time: "18:00",
    guests: 3,
    status: "completed",
    image: "🏝️",
  },
];

export default function MyBookingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">(
    "upcoming"
  );

  const filteredBookings = BOOKINGS.filter((booking) => {
    if (activeTab === "upcoming") return booking.status === "upcoming";
    if (activeTab === "past") return booking.status === "completed";
    if (activeTab === "cancelled") return booking.status === "cancelled";
    return false;
  });

  const renderBookingCard = ({ item }: { item: Booking }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/booking-detail",
          params: { bookingId: item.id },
        })
      }
      activeOpacity={0.7}
    >
      <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
        <View className="flex-row items-start gap-4">
          <View className="w-16 h-16 rounded-xl bg-gradient-to-b from-primary to-accent items-center justify-center">
            <Text className="text-4xl">{item.image}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground">
              {item.venueName}
            </Text>
            <Text className="text-sm text-muted mt-1">
              {item.date} at {item.time}
            </Text>
            <Text className="text-xs text-muted mt-1">
              {item.guests} {item.guests === 1 ? "guest" : "guests"}
            </Text>
            <View className="mt-2">
              {item.status === "upcoming" && (
                <View className="bg-primary rounded-full px-3 py-1 w-fit">
                  <Text className="text-xs font-bold text-foreground">
                    Confirmed
                  </Text>
                </View>
              )}
              {item.status === "completed" && (
                <View className="bg-accent rounded-full px-3 py-1 w-fit">
                  <Text className="text-xs font-bold text-foreground">
                    Completed
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="px-6">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">
            My Bookings
          </Text>
          <Text className="text-sm text-muted mt-2">
            Manage your exclusive experiences
          </Text>
        </View>

        {/* Tabs */}
        <View className="flex-row gap-2 mb-6">
          {(["upcoming", "past", "cancelled"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-full items-center border ${
                activeTab === tab
                  ? "bg-primary border-primary"
                  : "bg-surface border-border"
              }`}
              activeOpacity={0.8}
            >
              <Text
                className={`font-semibold capitalize ${
                  activeTab === tab ? "text-foreground" : "text-muted"
                }`}
              >
                {tab === "upcoming" ? "Upcoming" : tab === "past" ? "Past" : "Cancelled"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bookings List */}
        {filteredBookings.length > 0 ? (
          <FlatList
            data={filteredBookings}
            renderItem={renderBookingCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center py-12">
            <Text className="text-4xl mb-4">📭</Text>
            <Text className="text-lg font-semibold text-foreground">
              No {activeTab} bookings
            </Text>
            <Text className="text-sm text-muted mt-2 text-center">
              Start exploring and book your first exclusive experience
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)")}
              className="mt-6 bg-primary rounded-full px-6 py-3"
              activeOpacity={0.8}
            >
              <Text className="text-foreground font-bold">Explore Venues</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
