import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { PostRead } from "../types/api";
import VoteButtons from "./VoteButtons";

const BORDER = "#F0F0F0";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#A3A3A3";

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

interface PostCardProps {
  post: PostRead;
  onPress: () => void;
}

export default function PostCard({ post, onPress }: PostCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <VoteButtons
        targetType="post"
        targetUuid={post.uuid}
        initialVoteCount={post.vote_count}
      />
      <View style={styles.content}>
        <Text style={styles.message}>{post.message}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{timeAgo(post.created_at)}</Text>
          <Text style={styles.metaText}>
            {post.comment_count} {post.comment_count === 1 ? "comment" : "comments"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    color: TEXT_PRIMARY,
    lineHeight: 22,
    marginBottom: 8,
  },
  meta: {
    flexDirection: "row",
    gap: 16,
  },
  metaText: {
    fontSize: 13,
    color: TEXT_SECONDARY,
  },
});
