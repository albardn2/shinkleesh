import React, { useEffect, useRef, useState } from "react";
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Keyboard,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocation } from "../hooks/useLocation";
import { useFeed } from "../hooks/useFeed";
import { createPost } from "../services/posts";
import PostCard from "../components/PostCard";
import FeedToggle from "../components/FeedToggle";

type HomeStackParamList = {
  Home: undefined;
  PostDetail: { postUuid: string };
};

type Props = NativeStackScreenProps<HomeStackParamList, "Home">;

type FeedType = "new" | "hot";

const BG = "#FAFAFA";
const PRIMARY = "#52FFB8";
const PRIMARY_DARK = "#3DE0A0";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#737373";
const MAX_LENGTH = 500;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const [feedType, setFeedType] = useState<FeedType>("new");
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);

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

  const expand = () => {
    setExpanded(true);
    Animated.spring(expandAnim, {
      toValue: 1,
      useNativeDriver: false,
      tension: 65,
      friction: 11,
    }).start(() => {
      inputRef.current?.focus();
    });
  };

  const collapse = () => {
    Keyboard.dismiss();
    Animated.spring(expandAnim, {
      toValue: 0,
      useNativeDriver: false,
      tension: 65,
      friction: 11,
    }).start(() => {
      setExpanded(false);
      setMessage("");
    });
  };

  const handlePost = async () => {
    if (!message.trim() || !location) return;

    const text = message.trim();
    setPosting(true);
    collapse();

    try {
      const newPost = await createPost(text, location.lat, location.lng);
      feed.prependPost(newPost);
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  if (locationLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY_DARK} />
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

  const expandedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  const footerOpacity = expandAnim;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FeedToggle active={feedType} onChange={setFeedType} />

      {/* Always-visible composer */}
      <View style={styles.composer}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={!expanded ? expand : undefined}
        >
          <TextInput
            ref={inputRef}
            style={styles.composerInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#A3A3A3"
            value={message}
            onChangeText={setMessage}
            maxLength={MAX_LENGTH}
            editable={expanded}
            pointerEvents={expanded ? "auto" : "none"}
            multiline={expanded}
          />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.expandedArea,
            { maxHeight: expandedHeight, opacity: footerOpacity },
          ]}
        >
          <View style={styles.composerFooter}>
            <Text style={styles.charCount}>
              {message.length}/{MAX_LENGTH}
            </Text>
            <View style={styles.composerActions}>
              <TouchableOpacity onPress={collapse}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.postButton,
                  (!message.trim() || posting) && styles.postButtonDisabled,
                ]}
                onPress={handlePost}
                disabled={!message.trim() || posting}
                activeOpacity={0.8}
              >
                <Text style={styles.postButtonText}>
                  {posting ? "..." : "Post"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>

      <FlatList
        ref={listRef}
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
              color={PRIMARY_DARK}
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: BG,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: TEXT_SECONDARY,
  },
  errorText: {
    fontSize: 17,
    fontWeight: "600",
    color: TEXT_PRIMARY,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: "center",
  },
  composer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  composerInput: {
    fontSize: 15,
    color: TEXT_PRIMARY,
    paddingVertical: 4,
  },
  expandedArea: {
    overflow: "hidden",
  },
  composerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
  },
  charCount: {
    fontSize: 12,
    color: "#A3A3A3",
  },
  composerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cancelText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontWeight: "500",
  },
  postButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  postButtonDisabled: {
    opacity: 0.4,
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_PRIMARY,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "600",
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  footer: {
    paddingVertical: 16,
  },
});
