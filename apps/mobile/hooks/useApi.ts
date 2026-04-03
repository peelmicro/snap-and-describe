/**
 * API hooks for communicating with the Fastify backend.
 *
 * How React hooks work:
 * - Hooks are functions that start with "use" — React treats them specially
 * - useState() creates a reactive variable — when it changes, the component re-renders
 * - useEffect() runs side effects (like API calls) when dependencies change
 * - useCallback() memoizes a function so it doesn't change identity between renders
 *
 * Each hook returns: { data, loading, error, refresh/execute }
 * Components use these to show loading spinners, error messages, or the actual data.
 */
import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import { API_URL } from "../constants/api";
import type {
  ImageListResponse,
  ImageDetail,
  SearchResponse,
  ChatResponse,
} from "../types";

/**
 * Fetches the list of images from the API.
 * Called automatically when the component mounts (appears on screen).
 *
 * Usage in a component:
 *   const { data, loading, refresh } = useImages();
 *   if (loading) return <Spinner />;
 *   return data.items.map(img => <ImageCard key={img.id} image={img} />);
 */
export function useImages(page = 1, limit = 20) {
  const [data, setData] = useState<ImageListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/images?page=${page}&limit=${limit}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch images");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  // useEffect runs fetchImages when the component mounts,
  // and re-runs if page or limit change
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return { data, loading, error, refresh: fetchImages };
}

/**
 * Fetches a single image with full details (classifications, conversations, presigned URL).
 * The `id` parameter comes from navigation — when you tap an image in the gallery,
 * the router passes the image ID to the detail screen.
 */
export function useImageDetail(id: string) {
  const [data, setData] = useState<ImageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/images/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch image detail"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { data, loading, error, refresh: fetchDetail };
}

/**
 * Search hook — not auto-fetched on mount.
 * The `execute` function is called when the user submits the search form.
 * This pattern is different from useImages because we don't want to search
 * until the user types something.
 */
export function useSearch() {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/search?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute };
}

/**
 * Upload hook — sends an image file to the API.
 *
 * FormData is how browsers (and React Native) send files in HTTP requests.
 * It's the JavaScript equivalent of an HTML <form> with <input type="file">.
 * The API expects multipart/form-data (configured via @fastify/multipart).
 *
 * The `uri` comes from expo-image-picker — it's a local file path on the device
 * (e.g., "file:///data/user/0/.../image.jpg" on Android).
 */
export function useUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (uri: string, filename: string, mimeType: string) => {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();

        if (Platform.OS === "web") {
          // Web: fetch the blob from the data URI and create a File object
          // expo-image-picker on web returns a blob: or data: URI
          const response = await fetch(uri);
          const blob = await response.blob();
          const file = new File([blob], filename, { type: mimeType });
          formData.append("file", file);
        } else {
          // Mobile: React Native's FormData accepts this object format
          formData.append("file", {
            uri,
            name: filename,
            type: mimeType,
          } as any);
        }

        const res = await fetch(`${API_URL}/images/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Upload failed: ${body}`);
        }

        return await res.json();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Upload failed";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, error, execute };
}

/**
 * Chat hook — sends a message about an image and gets an AI response.
 * Maintains the conversationId so follow-up messages stay in the same thread.
 */
export function useChat(imageId: string) {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing conversation history on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/images/${imageId}/conversations`
        );
        if (!res.ok) return;
        const conversations = await res.json();
        if (conversations.length > 0) {
          // Use the most recent conversation
          const latest = conversations[conversations.length - 1];
          setConversationId(latest.id);
          if (latest.messages && latest.messages.length > 0) {
            setMessages(
              latest.messages.map((m: any) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              }))
            );
          }
        }
      } catch {
        // Silently fail — user can still start a new conversation
      }
    })();
  }, [imageId]);

  const sendMessage = useCallback(
    async (message: string) => {
      setLoading(true);
      setError(null);

      // Optimistically add the user message to the UI immediately
      // (before waiting for the API response)
      setMessages((prev) => [...prev, { role: "user", content: message }]);

      try {
        const res = await fetch(`${API_URL}/images/${imageId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            conversationId: conversationId || undefined,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: ChatResponse = await res.json();
        setConversationId(json.conversationId);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: json.response },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Chat failed");
        // Remove the optimistic user message on failure
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setLoading(false);
      }
    },
    [imageId, conversationId]
  );

  return { messages, loading, error, sendMessage };
}
