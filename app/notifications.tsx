import { useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useNotifications } from "@/lib/notifications-context";
import { useTranslation } from "react-i18next";

function formatTimeAgo(timestamp: string, t: (k: string, opts?: any) => string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, refetch } = useNotifications();

  // Recharge les notifications à chaque fois que l'écran prend le focus
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const TYPE_CONFIG = {
    reservation_confirmed: { emoji: "✅", color: "text-success", label: t("notifications.typeConfirmed") },
    reservation_cancelled: { emoji: "⚠️", color: "text-warning", label: t("notifications.typeCancelled") },
    vip_offer:             { emoji: "🎁", color: "text-primary", label: t("notifications.typeOffer") },
    reminder:              { emoji: "⏰", color: "text-warning", label: t("notifications.typeReminder") },
  };

  return (
    <ScreenContainer className="px-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>

        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text className="text-2xl text-primary">←</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground ml-4">
              {t("notifications.title")}
            </Text>
            {unreadCount > 0 && (
              <View className="ml-2 bg-primary rounded-full w-6 h-6 items-center justify-center">
                <Text className="text-xs font-bold text-background">{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.7}>
              <Text className="text-sm text-primary font-semibold">
                {t("notifications.markAllRead")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-6xl mb-4">🔔</Text>
            <Text className="text-xl font-bold text-foreground mb-2">
              {t("notifications.empty")}
            </Text>
            <Text className="text-sm text-muted text-center px-8">
              {t("notifications.emptyDesc")}
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {notifications.map((notification) => {
              const config = TYPE_CONFIG[notification.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.reminder;
              return (
                <TouchableOpacity
                  key={notification.id}
                  onPress={() => markAsRead(notification.id)}
                  className={`bg-surface rounded-2xl p-4 border ${notification.read ? "border-border" : "border-primary"}`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-start gap-3">
                    <View className="w-10 h-10 rounded-full bg-background items-center justify-center">
                      <Text className="text-xl">{config.emoji}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-sm font-bold text-foreground flex-1">
                          {notification.title}
                        </Text>
                        {!notification.read && (
                          <View className="w-2 h-2 rounded-full bg-primary ml-2" />
                        )}
                      </View>
                      <Text className="text-sm text-muted mb-2">{notification.message}</Text>
                      <View className="flex-row items-center justify-between">
                        <Text className={`text-xs ${config.color} font-semibold`}>{config.label}</Text>
                        <Text className="text-xs text-muted">
                          {formatTimeAgo(notification.timestamp, t)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
