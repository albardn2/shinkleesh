import { useState, useCallback } from "react";
import type { PostRead } from "../types/api";
import { getFeedNew, getFeedHot } from "../services/posts";

type FeedType = "new" | "hot";

export function useFeed(feedType: FeedType, lat: number, lng: number) {
  const [posts, setPosts] = useState<PostRead[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = feedType === "new" ? getFeedNew : getFeedHot;

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFeed(lat, lng, 1);
      setPosts(data.posts);
      setPage(1);
      setTotalPages(data.pages);
    } catch {
      // silent fail, posts stay empty
    } finally {
      setLoading(false);
    }
  }, [feedType, lat, lng]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchFeed(lat, lng, 1);
      setPosts(data.posts);
      setPage(1);
      setTotalPages(data.pages);
    } catch {
      // silent fail
    } finally {
      setRefreshing(false);
    }
  }, [feedType, lat, lng]);

  const loadMore = useCallback(async () => {
    if (loading || page >= totalPages) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const data = await fetchFeed(lat, lng, nextPage);
      setPosts((prev) => [...prev, ...data.posts]);
      setPage(nextPage);
      setTotalPages(data.pages);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [feedType, lat, lng, page, totalPages, loading]);

  const hasMore = page < totalPages;

  const prependPost = useCallback((post: PostRead) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  return { posts, loading, refreshing, loadInitial, refresh, loadMore, hasMore, prependPost };
}
