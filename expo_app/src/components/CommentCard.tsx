import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { CommentRead } from "../types/api";
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

interface CommentCardProps {
  comment: CommentRead;
}

export default function CommentCard({ comment }: CommentCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.message}>{comment.message}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{timeAgo(comment.created_at)}</Text>
        </View>
      </View>
      <VoteButtons
        targetType="comment"
        targetUuid={comment.uuid}
        initialVoteCount={comment.vote_count}
      />
    </View>
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
