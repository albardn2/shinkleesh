import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

type FeedType = "new" | "hot";

const PRIMARY_DARK = "#3DE0A0";
const BORDER = "#E5E5E5";
const TEXT_MUTED = "#A3A3A3";

interface FeedToggleProps {
  active: FeedType;
  onChange: (type: FeedType) => void;
}

export default function FeedToggle({ active, onChange }: FeedToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, active === "new" && styles.activeTab]}
        onPress={() => onChange("new")}
      >
        <Text style={[styles.tabText, active === "new" && styles.activeText]}>
          New
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, active === "hot" && styles.activeTab]}
        onPress={() => onChange("hot")}
      >
        <Text style={[styles.tabText, active === "hot" && styles.activeText]}>
          Hot
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: PRIMARY_DARK,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_MUTED,
  },
  activeText: {
    color: "#fff",
  },
});
