import {
  ScrollView, Text, View, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { Image } from "expo-image";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const INTERESTS = [
  { id: "beach",     label: "🏖️ Beach Clubs" },
  { id: "nightlife", label: "🎉 Nightlife" },
  { id: "dining",    label: "🍽️ Fine Dining" },
  { id: "spa",       label: "🧖 Spa & Wellness" },
  { id: "events",    label: "🌟 Events" },
  { id: "shopping",  label: "🛍️ Shopping" },
  { id: "yachts",    label: "⛵ Yachts" },
  { id: "golf",      label: "⛳ Golf" },
];

export default function EditProfileScreen() {
  const { t }   = useTranslation();
  const colors  = useColors();
  const router  = useRouter();
  const { user } = useAuth();
  const { profile, loading, saving, error, save } = useProfile(user?.id);

  // Form state — initialised from profile once loaded
  const [name,      setName]      = useState("");
  const [bio,       setBio]       = useState("");
  const [instagram, setInstagram] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [prefs,     setPrefs]     = useState<string[]>([]);
  const [saved,     setSaved]     = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.display_name   ?? "");
    setBio(profile.bio             ?? "");
    setInstagram(profile.instagram_handle ?? "");
    setAvatarUrl(profile.avatar_url ?? "");
    setPrefs(profile.preferences   ?? []);
  }, [profile]);

  const togglePref = (id: string) => {
    setPrefs((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    console.log("[EditProfile] saving — userId:", user?.id);
    const payload = {
      display_name:     name.trim() || null,
      bio:              bio.trim()  || null,
      instagram_handle: instagram.trim() || null,
      avatar_url:       avatarUrl.trim() || null,
      preferences:      prefs,
    };
    console.log("[EditProfile] payload:", JSON.stringify(payload));
    try {
      await save(payload);
      console.log("[EditProfile] save OK");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      console.error("[EditProfile] save failed:", e?.message);
      if (Platform.OS === "web") {
        window.alert(`Failed to save: ${e?.message ?? "unknown error"}`);
      } else {
        Alert.alert("Error", e?.message ?? "Failed to save profile.");
      }
    }
  };

  const avatarSource = avatarUrl.trim()
    ? { uri: avatarUrl.trim() }
    : null;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "600" }}>{t("common.back")}</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>{t("editProfile.title")}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.8}>
            {saving ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={{ color: saved ? "#4ADE80" : colors.primary, fontWeight: "700", fontSize: 15 }}>
                {saved ? t("editProfile.savedShort") : t("editProfile.save")}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <>
            {/* Avatar */}
            <View style={{ alignItems: "center", marginBottom: 28 }}>
              <View style={{
                width: 100, height: 100, borderRadius: 50,
                backgroundColor: "rgba(212,175,55,0.15)",
                borderWidth: 2, borderColor: colors.primary,
                alignItems: "center", justifyContent: "center",
                overflow: "hidden", marginBottom: 12,
              }}>
                {avatarSource ? (
                  <Image source={avatarSource} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                ) : (
                  <Text style={{ fontSize: 40 }}>👤</Text>
                )}
              </View>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>
                {user?.email}
              </Text>
            </View>

            {/* Avatar URL */}
            <View style={{ marginBottom: 16 }}>
              <Text style={label(colors)}>{t("editProfile.photoUrl")}</Text>
              <TextInput
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor="#444"
                autoCapitalize="none"
                autoCorrect={false}
                style={input(colors)}
              />
              <Text style={{ color: "#555", fontSize: 10, marginTop: 4 }}>
                {t("editProfile.photoUrlHint")}
              </Text>
            </View>

            {/* Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={label(colors)}>{t("editProfile.displayName")}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#444"
                autoCapitalize="words"
                style={input(colors)}
              />
            </View>

            {/* Bio */}
            <View style={{ marginBottom: 16 }}>
              <Text style={label(colors)}>{t("editProfile.bio")}</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell the community about yourself..."
                placeholderTextColor="#444"
                multiline
                numberOfLines={3}
                maxLength={180}
                style={[input(colors), { height: 80, textAlignVertical: "top" }]}
              />
              <Text style={{ color: "#555", fontSize: 10, marginTop: 4, textAlign: "right" }}>
                {bio.length}/180
              </Text>
            </View>

            {/* Instagram */}
            <View style={{ marginBottom: 24 }}>
              <Text style={label(colors)}>{t("editProfile.instagram")}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 0 }}>
                <View style={{
                  backgroundColor: colors.surface, borderWidth: 1, borderRightWidth: 0,
                  borderColor: colors.border, borderTopLeftRadius: 12, borderBottomLeftRadius: 12,
                  paddingHorizontal: 12, paddingVertical: 14,
                }}>
                  <Text style={{ color: "#888", fontSize: 15 }}>@</Text>
                </View>
                <TextInput
                  value={instagram.replace(/^@/, "")}
                  onChangeText={(v) => setInstagram(v.replace(/^@/, ""))}
                  placeholder="your_instagram"
                  placeholderTextColor="#444"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[input(colors), {
                    flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0,
                    borderTopRightRadius: 12, borderBottomRightRadius: 12,
                  }]}
                />
              </View>
            </View>

            {/* Interests */}
            <View style={{ marginBottom: 24 }}>
              <Text style={label(colors)}>{t("editProfile.interests")}</Text>
              <Text style={{ color: "#555", fontSize: 11, marginBottom: 12 }}>
                {t("editProfile.interestsHint")}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {INTERESTS.map((interest) => {
                  const active = prefs.includes(interest.id);
                  return (
                    <TouchableOpacity
                      key={interest.id}
                      onPress={() => togglePref(interest.id)}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 9,
                        borderRadius: 20, borderWidth: 1,
                        backgroundColor: active ? "rgba(212,175,55,0.15)" : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "600", color: active ? colors.primary : colors.muted }}>
                        {interest.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Error */}
            {error && (
              <View style={{ backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 12, padding: 12, marginBottom: 16 }}>
                <Text style={{ color: "#EF4444", fontSize: 13 }}>{error}</Text>
              </View>
            )}

            {/* Save button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
              style={{
                backgroundColor: saving ? "#333" : colors.primary,
                borderRadius: 50, paddingVertical: 16, alignItems: "center",
                marginTop: 8,
              }}
            >
              {saving ? (
                <ActivityIndicator color="#0A0E13" />
              ) : (
                <Text style={{ color: "#0A0E13", fontWeight: "800", fontSize: 16 }}>
                  {saved ? t("editProfile.profileSaved") : t("editProfile.saveChanges")}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const label = (colors: any) => ({
  fontSize: 10, fontWeight: "700" as const,
  color: colors.muted, letterSpacing: 1,
  marginBottom: 8, textTransform: "uppercase" as const,
});

const input = (colors: any) => ({
  backgroundColor: colors.surface,
  borderWidth: 1, borderColor: colors.border,
  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
  fontSize: 14, color: colors.foreground,
});
