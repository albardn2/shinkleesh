import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLocation } from "../hooks/useLocation";
import { useFeed } from "../hooks/useFeed";
import PostCard from "../components/PostCard";
import FeedToggle from "../components/FeedToggle";

type HomeStackParamList = {
  Home: undefined;
  PostDetail: { postUuid: string };
  CreatePost: undefined;
};

type Props = NativeStackScreenProps<HomeStackParamList, "Home">;

type FeedType = "new" | "hot";

export default function HomeScreen({ navigation }: Props) {
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const [feedType, setFeedType] = useState<FeedType>("new");

  const feed = useFeed(
    feedType,
    location?.lat ?? 0,
    location?.lng ?? 0
  );

  useEffect(() => {
    if (location) {
      feed.loadInitial();
    }
  }, [location, feedType]);

  if (locationLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (locationError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Location access required</Text>
        <Text style={styles.errorSubtext}>
          Please enable location permissions to see nearby posts.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FeedToggle active={feedType} onChange={setFeedType} />

      <FlatList
        data={feed.posts}
        keyExtractor={(item) => item.uuid}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() =>
              navigation.navigate("PostDetail", { postUuid: item.uuid })
            }
          />
        )}
        refreshing={feed.refreshing}
        onRefresh={feed.refresh}
        onEndReached={feed.hasMore ? feed.loadMore : undefined}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !feed.loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No posts nearby yet</Text>
              <Text style={styles.emptySubtext}>Be the first to post!</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          feed.loading && feed.posts.length > 0 ? (
            <ActivityIndicator
              style={styles.footer}
              size="small"
              color="#6C63FF"
            />
          ) : null
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreatePost")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
  },
  footer: {
    paddingVertical: 16,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: "#fff",
    lineHeight: 30,
  },
});
