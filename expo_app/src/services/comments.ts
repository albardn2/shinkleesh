import api from "./api";
import type { CommentRead, CommentPage } from "../types/api";

export async function getComments(
  postUuid: string,
  page = 1,
  perPage = 20
): Promise<CommentPage> {
  const { data } = await api.get<CommentPage>("/comments", {
    params: { post_uuid: postUuid, page, per_page: perPage },
  });
  return data;
}

export async function createComment(
  postUuid: string,
  message: string,
  lat: number,
  lng: number
): Promise<CommentRead> {
  const { data } = await api.post<CommentRead>("/comments", {
    post_uuid: postUuid,
    message,
    lat,
    lng,
  });
  return data;
}
