import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { castVote, removeVote } from "../services/votes";

const PRIMARY_DARK = "#3DE0A0";
const DOWNVOTE = "#FF6B6B";
const TEXT_MUTED = "#A3A3A3";
const TEXT_PRIMARY = "#1A1A1A";

interface VoteButtonsProps {
  targetType: "post" | "comment";
  targetUuid: string;
  initialVoteCount: number;
}

type UserVote = "upvote" | "downvote" | null;

export default function VoteButtons({
  targetType,
  targetUuid,
  initialVoteCount,
}: VoteButtonsProps) {
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [userVote, setUserVote] = useState<UserVote>(null);

  const handleVote = async (voteType: "upvote" | "downvote") => {
    const prevVote = userVote;
    const prevCount = voteCount;

    if (userVote === voteType) {
      setUserVote(null);
      setVoteCount(voteType === "upvote" ? voteCount - 1 : voteCount + 1);
      try {
        await removeVote(targetType, targetUuid);
      } catch {
        setUserVote(prevVote);
        setVoteCount(prevCount);
      }
    } else {
      let delta = voteType === "upvote" ? 1 : -1;
      if (prevVote === "upvote") delta -= 1;
      if (prevVote === "downvote") delta += 1;

      setUserVote(voteType);
      setVoteCount(voteCount + delta);
      try {
        await castVote(targetType, targetUuid, voteType);
      } catch {
        setUserVote(prevVote);
        setVoteCount(prevCount);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => handleVote("upvote")}
        style={styles.button}
      >
        <Text
          style={[styles.arrow, userVote === "upvote" && styles.activeUpvote]}
        >
          ▲
        </Text>
      </TouchableOpacity>
      <Text style={styles.count}>{voteCount}</Text>
      <TouchableOpacity
        onPress={() => handleVote("downvote")}
        style={styles.button}
      >
        <Text
          style={[
            styles.arrow,
            userVote === "downvote" && styles.activeDownvote,
          ]}
        >
          ▼
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginRight: 12,
  },
  button: {
    padding: 4,
  },
  arrow: {
    fontSize: 14,
    color: TEXT_MUTED,
  },
  activeUpvote: {
    color: PRIMARY_DARK,
  },
  activeDownvote: {
    color: DOWNVOTE,
  },
  count: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_PRIMARY,
    marginVertical: 2,
  },
});
