import { useState } from "react";
import {
  View, Text, TouchableOpacity, Modal, Pressable,
} from "react-native";
import { useTranslation } from "react-i18next";
import { LANGUAGES, changeLanguage, type LangCode } from "@/lib/i18n";
import { useColors } from "@/hooks/use-colors";

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const colors = useColors();
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const handleSelect = async (code: LangCode) => {
    setOpen(false);
    await changeLanguage(code);
  };

  return (
    <>
      {/* Trigger button — shows current flag */}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
        }}
        accessibilityLabel="Select language"
      >
        <Text style={{ fontSize: 20 }}>{current.flag}</Text>
        <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "600" }}>
          {current.code.toUpperCase()}
        </Text>
      </TouchableOpacity>

      {/* Dropdown modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={() => setOpen(false)}
        >
          {/* Panel — positioned top-right */}
          <View
            style={{
              position: "absolute",
              top: 80,
              right: 20,
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: "hidden",
              minWidth: 160,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            {LANGUAGES.map((lang, i) => {
              const isSelected = i18n.language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => handleSelect(lang.code)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 13,
                    backgroundColor: isSelected
                      ? "rgba(212,175,55,0.12)"
                      : "transparent",
                    borderBottomWidth: i < LANGUAGES.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{lang.flag}</Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected ? "#D4AF37" : colors.foreground,
                      flex: 1,
                    }}
                  >
                    {lang.label}
                  </Text>
                  {isSelected && (
                    <Text style={{ fontSize: 12, color: "#D4AF37" }}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
