import api from "./api";
import type { VoteRead } from "../types/api";

export async function castVote(
  targetType: "post" | "comment",
  targetUuid: string,
  voteType: "upvote" | "downvote"
): Promise<VoteRead> {
  const { data } = await api.post<VoteRead>("/votes", {
    target_type: targetType,
    target_uuid: targetUuid,
    vote_type: voteType,
  });
  return data;
}

export async function removeVote(
  targetType: "post" | "comment",
  targetUuid: string
): Promise<VoteRead> {
  const { data } = await api.delete<VoteRead>(
    `/votes/${targetType}/${targetUuid}`
  );
  return data;
}
