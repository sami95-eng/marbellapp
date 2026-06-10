import {
  View, Text, TouchableOpacity, Share, Platform, Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";

function generateQRCode(userId: string, offerId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `MSS-${offerId.toUpperCase().slice(0, 4)}-${userId.slice(0, 4).toUpperCase()}-${ts}`;
}

function QRCodeDisplay({ value, size = 160 }: { value: string; size?: number }) {
  const cells = 12;
  const cellSize = size / cells;

  const grid: boolean[][] = Array.from({ length: cells }, (_, row) =>
    Array.from({ length: cells }, (_, col) => {
      const seed = value.charCodeAt((row * cells + col) % value.length);
      return ((seed * (row + 1) * (col + 1)) % 7) < 4;
    })
  );

  const forceCorner = (r: number, c: number) => {
    for (let dr = 0; dr < 3; dr++)
      for (let dc = 0; dc < 3; dc++)
        grid[r + dr][c + dc] = dr === 0 || dr === 2 || dc === 0 || dc === 2;
  };
  forceCorner(0, 0);
  forceCorner(0, cells - 3);
  forceCorner(cells - 3, 0);

  return (
    <View style={{ width: size, height: size, backgroundColor: "#fff", padding: 8, borderRadius: 12 }}>
      {grid.map((row, r) => (
        <View key={r} style={{ flexDirection: "row" }}>
          {row.map((filled, c) => (
            <View
              key={c}
              style={{
                width: cellSize - 1,
                height: cellSize - 1,
                backgroundColor: filled ? "#0a0a0f" : "#fff",
                margin: 0.5,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function VipQRScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    offerId: string;
    offerTitle: string;
    venue: string;
    date: string;
    type: string;
    requirement: string;
    instagramHandle: string;
  }>();

  const qrCode = generateQRCode(user?.id?.toString() ?? "guest", params.offerId ?? "vip");
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const hours   = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const pad     = (n: number) => String(n).padStart(2, "0");

  const typeIcon: Record<string, string> = { table: "🪑", bed: "🛏️", bottle: "🍾" };
  const icon = typeIcon[params.type ?? "table"] ?? "🎫";

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${t("vipQr.title")}\n${params.offerTitle} — ${params.venue}\n${params.date}\nCode : ${qrCode}`,
      });
    } catch {
      Alert.alert("", t("vipQr.shareError"));
    }
  };

  return (
    <ScreenContainer className="px-6">
      <View style={{ flex: 1, justifyContent: "space-between", paddingVertical: 16 }}>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: "#D4AF37", fontSize: 16 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#D4AF37" }}>{t("vipQr.title")}</Text>
        </View>

        {/* Main card */}
        <View style={{
          backgroundColor: "#111120",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#D4AF3740",
          padding: 24,
          alignItems: "center",
          gap: 16,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 28 }}>{icon}</Text>
            <View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#e8e8e8" }}>{params.offerTitle}</Text>
              <Text style={{ fontSize: 11, color: "#888" }}>{params.venue}</Text>
            </View>
          </View>

          <View style={{
            backgroundColor: "#D4AF3715",
            borderRadius: 8,
            paddingVertical: 6,
            paddingHorizontal: 16,
            borderWidth: 0.5,
            borderColor: "#D4AF3740",
          }}>
            <Text style={{ fontSize: 12, color: "#D4AF37", fontWeight: "600" }}>📅 {params.date}</Text>
          </View>

          <View style={{ alignItems: "center", gap: 10 }}>
            <QRCodeDisplay value={qrCode} size={168} />
            <Text style={{ fontSize: 11, color: "#555", letterSpacing: 2, fontFamily: "monospace" }}>
              {qrCode}
            </Text>
          </View>

          <View style={{ alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 10, color: "#666" }}>{t("vipQr.expires")}</Text>
            <Text style={{
              fontSize: 22,
              fontWeight: "700",
              color: timeLeft < 3600 ? "#EF4444" : "#D4AF37",
              letterSpacing: 2,
            }}>
              {pad(hours)}:{pad(minutes)}:{pad(seconds)}
            </Text>
          </View>
        </View>

        {/* Conditions */}
        <View style={{
          backgroundColor: "#0d0d1a",
          borderRadius: 12,
          padding: 14,
          borderWidth: 0.5,
          borderColor: "#D4AF3720",
          gap: 10,
        }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#D4AF37" }}>📸 {t("vipQr.validate")}</Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#833AB420", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#c084fc" }}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: "#e8e8e8", fontWeight: "600" }}>
                {t("vipQr.step1Title", { handle: params.instagramHandle ?? "@establishment" })}
              </Text>
            </View>
            <View style={{ backgroundColor: "#833AB420", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 10, color: "#c084fc", fontWeight: "600" }}>Instagram</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#833AB420", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#c084fc" }}>2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: "#e8e8e8", fontWeight: "600" }}>{t("vipQr.step2Title")}</Text>
              <Text style={{ fontSize: 10, color: "#888" }}>{t("vipQr.step2Sub")}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#D4AF3720", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#D4AF37" }}>3</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: "#e8e8e8", fontWeight: "600" }}>{t("vipQr.step3Title")}</Text>
              <Text style={{ fontSize: 10, color: "#888" }}>{t("vipQr.step3Sub")}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={handleShare}
            style={{
              backgroundColor: "#D4AF37",
              borderRadius: 50,
              paddingVertical: 14,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#0a0a0f" }}>
              {t("vipQr.share")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ alignItems: "center", paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 13, color: "#555" }}>{t("vipQr.backToOffers")}</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScreenContainer>
  );
}
