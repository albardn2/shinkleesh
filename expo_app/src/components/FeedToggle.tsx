import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

type FeedType = "new" | "hot";

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
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 3,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
  activeText: {
    color: "#6C63FF",
  },
});
