import api from "./api";
import type { PostRead, PostPage } from "../types/api";

export async function getFeedNew(
  lat: number,
  lng: number,
  page = 1,
  perPage = 20
): Promise<PostPage> {
  const { data } = await api.get<PostPage>("/posts/feed/new", {
    params: { lat, lng, page, per_page: perPage },
  });
  return data;
}

export async function getFeedHot(
  lat: number,
  lng: number,
  page = 1,
  perPage = 20
): Promise<PostPage> {
  const { data } = await api.get<PostPage>("/posts/feed/hot", {
    params: { lat, lng, page, per_page: perPage },
  });
  return data;
}

export async function createPost(
  message: string,
  lat: number,
  lng: number
): Promise<PostRead> {
  const { data } = await api.post<PostRead>("/posts", { message, lat, lng });
  return data;
}

export async function getPost(postUuid: string): Promise<PostRead> {
  const { data } = await api.get<PostRead>(`/posts/${postUuid}`);
  return data;
}
