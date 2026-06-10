import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";

export default function BookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();

  const bookingDetails = {
    id: "MSS-2026-5847",
    venueName: "Ocean Club Marbella",
    date: "2026-05-30",
    time: "19:00",
    guests: 2,
    status: "confirmed",
    confirmationEmail: "sofia@example.com",
    specialRequests: "Vegetarian option for one guest",
  };

  return (
    <ScreenContainer className="px-6">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.6}
          >
            <Text className="text-primary font-bold text-lg">←</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground">
            Booking Details
          </Text>
        </View>

        {/* Status Card */}
        <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
              <Text className="text-xl">✓</Text>
            </View>
            <View>
              <Text className="text-lg font-bold text-foreground">
                Confirmed
              </Text>
              <Text className="text-xs text-muted">Your booking is confirmed</Text>
            </View>
          </View>
          <View className="border-t border-border pt-4">
            <Text className="text-xs text-muted font-semibold mb-1">
              CONFIRMATION #
            </Text>
            <Text className="text-xl font-bold text-primary">
              {bookingDetails.id}
            </Text>
          </View>
        </View>

        {/* Venue Info */}
        <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">Venue</Text>
          <View className="flex-row items-center gap-3">
            <View className="w-16 h-16 rounded-xl bg-gradient-to-b from-primary to-accent items-center justify-center">
              <Text className="text-3xl">🌊</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">
                {bookingDetails.venueName}
              </Text>
              <Text className="text-sm text-muted mt-1">Beach Club</Text>
            </View>
          </View>
        </View>

        {/* Reservation Details */}
        <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">
            Reservation Details
          </Text>

          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted">Date</Text>
              <Text className="text-sm font-semibold text-foreground">
                {bookingDetails.date}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted">Time</Text>
              <Text className="text-sm font-semibold text-foreground">
                {bookingDetails.time}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted">Guests</Text>
              <Text className="text-sm font-semibold text-foreground">
                {bookingDetails.guests}
              </Text>
            </View>
          </View>
        </View>

        {/* Special Requests */}
        {bookingDetails.specialRequests && (
          <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
            <Text className="text-lg font-bold text-foreground mb-2">
              Special Requests
            </Text>
            <Text className="text-sm text-muted leading-relaxed">
              {bookingDetails.specialRequests}
            </Text>
          </View>
        )}

        {/* Confirmation Email */}
        <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
          <Text className="text-sm text-muted font-semibold mb-2">
            CONFIRMATION SENT TO
          </Text>
          <Text className="text-base font-semibold text-foreground">
            {bookingDetails.confirmationEmail}
          </Text>
        </View>

        {/* What to Bring */}
        <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">
            What to Bring
          </Text>
          <View className="gap-3">
            <View className="flex-row gap-3">
              <Text className="text-lg">📱</Text>
              <View className="flex-1">
                <Text className="font-semibold text-foreground text-sm">
                  Your Confirmation
                </Text>
                <Text className="text-xs text-muted mt-1">
                  Show your confirmation email or number at check-in
                </Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              <Text className="text-lg">📸</Text>
              <View className="flex-1">
                <Text className="font-semibold text-foreground text-sm">
                  Camera Ready
                </Text>
                <Text className="text-xs text-muted mt-1">
                  Share your experience on social media
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* CTA Buttons */}
        <View className="gap-3 mb-8">
          <TouchableOpacity
            className="bg-primary rounded-full py-4 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-foreground font-bold">Get Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="border-2 border-primary rounded-full py-4 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-primary font-bold">Modify Booking</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="border-2 border-error rounded-full py-4 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-error font-bold">Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
