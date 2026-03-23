import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { CommentRead } from "../types/api";
import VoteButtons from "./VoteButtons";

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

interface CommentCardProps {
  comment: CommentRead;
}

export default function CommentCard({ comment }: CommentCardProps) {
  return (
    <View style={styles.card}>
      <VoteButtons
        targetType="comment"
        targetUuid={comment.uuid}
        initialVoteCount={comment.vote_count}
      />
      <View style={styles.content}>
        <Text style={styles.message}>{comment.message}</Text>
        <Text style={styles.time}>{timeAgo(comment.created_at)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 12,
    paddingLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    color: "#333",
    lineHeight: 20,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
});
