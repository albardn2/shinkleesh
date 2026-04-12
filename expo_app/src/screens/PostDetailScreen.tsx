import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getPost } from "../services/posts";
import { getComments, createComment } from "../services/comments";
import { useLocation } from "../hooks/useLocation";
import type { PostRead, CommentRead } from "../types/api";
import VoteButtons from "../components/VoteButtons";
import CommentCard from "../components/CommentCard";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

type Props = NativeStackScreenProps<
  { PostDetail: { postUuid: string } },
  "PostDetail"
>;

export default function PostDetailScreen({ route }: Props) {
  const { postUuid } = route.params;
  const { location } = useLocation();
  const [post, setPost] = useState<PostRead | null>(null);
  const [comments, setComments] = useState<CommentRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

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
      setCommentText("");
    });
  };

  const load = async () => {
    try {
      const [postData, commentData] = await Promise.all([
        getPost(postUuid),
        getComments(postUuid),
      ]);
      setPost(postData);
      setComments(commentData.comments);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [postUuid]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [postData, commentData] = await Promise.all([
        getPost(postUuid),
        getComments(postUuid),
      ]);
      setPost(postData);
      setComments(commentData.comments);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !location) return;

    const text = commentText.trim();
    setSubmitting(true);
    collapse();

    try {
      const newComment = await createComment(
        postUuid,
        text,
        location.lat,
        location.lng
      );
      setComments((prev) => [...prev, newComment]);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const expandedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  const footerOpacity = expandAnim;

  if (loading || !post) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={comments}
        keyExtractor={(item) => `${item.uuid}-${refreshKey}`}
        renderItem={({ item }) => <CommentCard comment={item} />}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <View>
            <View style={styles.postContainer}>
              <View style={styles.postRow}>
                <View style={styles.postContent}>
                  <Text style={styles.postMessage}>{post.message}</Text>
                  <View style={styles.postMetaRow}>
                    <Text style={styles.postMeta}>
                      {timeAgo(post.created_at)}
                    </Text>
                    <Text style={styles.postMeta}>
                      {post.comment_count}{" "}
                      {post.comment_count === 1 ? "reply" : "replies"}
                    </Text>
                    <Text style={styles.postMeta}>
                      {Math.round(post.distance_from_user ?? 0)} km
                    </Text>
                  </View>
                </View>
                <VoteButtons
                  key={`post-vote-${refreshKey}`}
                  targetType="post"
                  targetUuid={post.uuid}
                  initialVoteCount={post.vote_count}
                />
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.commentHeader}>
              <Text style={styles.commentHeaderText}>Replies</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No replies yet</Text>
          </View>
        }
      />

      <View style={styles.composer}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={!expanded ? expand : undefined}
        >
          <TextInput
            ref={inputRef}
            style={styles.composerInput}
            placeholder="Write a reply..."
            placeholderTextColor="#A3A3A3"
            value={commentText}
            onChangeText={setCommentText}
            maxLength={300}
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
              {commentText.length}/300
            </Text>
            <View style={styles.composerActions}>
              <TouchableOpacity onPress={collapse}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.replyButton,
                  (!commentText.trim() || submitting) && styles.replyButtonDisabled,
                ]}
                onPress={handleComment}
                disabled={!commentText.trim() || submitting}
                activeOpacity={0.8}
              >
                <Text style={styles.replyButtonText}>
                  {submitting ? "..." : "Reply"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  postContainer: {
    backgroundColor: "#fff",
    paddingBottom: 4,
  },
  postRow: {
    flexDirection: "row",
    padding: 16,
  },
  postContent: {
    flex: 1,
  },
  postMessage: {
    fontSize: 17,
    color: "#1A1A1A",
    lineHeight: 24,
    marginBottom: 10,
  },
  postMetaRow: {
    flexDirection: "row",
    gap: 16,
  },
  postMeta: {
    fontSize: 13,
    color: "#A3A3A3",
  },
  divider: {
    height: 6,
    backgroundColor: "#F0F0F0",
  },
  commentHeader: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
  },
  commentHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3DE0A0",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  empty: {
    alignItems: "center",
    paddingTop: 40,
    backgroundColor: "#fff",
  },
  emptyText: {
    fontSize: 14,
    color: "#A3A3A3",
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
    color: "#1A1A1A",
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
  composerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cancelText: {
    fontSize: 14,
    color: "#737373",
    fontWeight: "500",
  },
  charCount: {
    fontSize: 12,
    color: "#A3A3A3",
  },
  replyButton: {
    backgroundColor: "#3DE0A0",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  replyButtonDisabled: {
    opacity: 0.4,
  },
  replyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
});
