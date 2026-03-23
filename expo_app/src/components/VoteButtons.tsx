import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { castVote, removeVote } from "../services/votes";

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
      // remove vote
      setUserVote(null);
      setVoteCount(voteType === "upvote" ? voteCount - 1 : voteCount + 1);
      try {
        await removeVote(targetType, targetUuid);
      } catch {
        setUserVote(prevVote);
        setVoteCount(prevCount);
      }
    } else {
      // cast or change vote
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
    fontSize: 16,
    color: "#999",
  },
  activeUpvote: {
    color: "#6C63FF",
  },
  activeDownvote: {
    color: "#FF6B6B",
  },
  count: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginVertical: 2,
  },
});
