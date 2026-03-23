import React, { useEffect, useState } from "react";
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
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getPost } from "../services/posts";
import { getComments, createComment } from "../services/comments";
import { useLocation } from "../hooks/useLocation";
import type { PostRead, CommentRead } from "../types/api";
import VoteButtons from "../components/VoteButtons";
import CommentCard from "../components/CommentCard";

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
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleComment = async () => {
    if (!commentText.trim() || !location) return;

    setSubmitting(true);
    try {
      const newComment = await createComment(
        postUuid,
        commentText.trim(),
        location.lat,
        location.lng
      );
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
        keyExtractor={(item) => item.uuid}
        renderItem={({ item }) => <CommentCard comment={item} />}
        ListHeaderComponent={
          <View style={styles.postContainer}>
            <View style={styles.postRow}>
              <VoteButtons
                targetType="post"
                targetUuid={post.uuid}
                initialVoteCount={post.vote_count}
              />
              <View style={styles.postContent}>
                <Text style={styles.postMessage}>{post.message}</Text>
                <Text style={styles.postMeta}>
                  {post.comment_count} comments
                </Text>
              </View>
            </View>
            <View style={styles.commentHeader}>
              <Text style={styles.commentHeaderText}>Comments</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No comments yet</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          placeholderTextColor="#999"
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={300}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleComment}
          disabled={!commentText.trim() || submitting}
        >
          <Text
            style={[
              styles.sendText,
              (!commentText.trim() || submitting) && styles.sendDisabled,
            ]}
          >
            Send
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: "#fff",
  },
  postContainer: {
    borderBottomWidth: 8,
    borderBottomColor: "#f0f0f0",
  },
  postRow: {
    flexDirection: "row",
    padding: 16,
  },
  postContent: {
    flex: 1,
  },
  postMessage: {
    fontSize: 18,
    color: "#333",
    lineHeight: 26,
    marginBottom: 8,
  },
  postMeta: {
    fontSize: 13,
    color: "#999",
  },
  commentHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  commentHeaderText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  empty: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  commentInput: {
    flex: 1,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    marginRight: 8,
  },
  sendButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sendText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6C63FF",
  },
  sendDisabled: {
    opacity: 0.4,
  },
});
