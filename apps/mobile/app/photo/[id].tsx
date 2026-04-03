/**
 * Photo Detail Screen — shows full image, AI analysis, and chat interface.
 *
 * Dynamic route: the [id] in the filename means this screen receives
 * the image ID from the URL. Expo Router extracts it via useLocalSearchParams().
 *
 * Example: navigating to /photo/abc-123 → useLocalSearchParams() returns { id: "abc-123" }
 *
 * This screen has three sections:
 * 1. Full-size image with presigned MinIO URL
 * 2. AI analysis: description, tags, classifications
 * 3. Chat: ask follow-up questions about the photo
 *
 * Key concepts:
 * - useLocalSearchParams(): Expo Router hook to read URL parameters
 * - KeyboardAvoidingView: shifts content up when the keyboard opens,
 *   so the chat input isn't hidden behind the keyboard
 * - ScrollView vs FlatList: we use ScrollView here because the content
 *   is a fixed structure (not a dynamic list), and FlatList would be overkill
 */
import { useState, useRef } from "react";
import {
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";

import { Text, View } from "@/components/Themed";
import { useImageDetail, useChat } from "@/hooks/useApi";
import { API_URL } from "@/constants/api";

export default function PhotoDetailScreen() {
  // Extract the image ID from the URL (e.g., /photo/abc-123 → id = "abc-123")
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: image, loading, error } = useImageDetail(id);
  const {
    messages: chatMessages,
    loading: chatLoading,
    error: chatError,
    sendMessage,
  } = useChat(id);

  const [chatInput, setChatInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const message = chatInput;
    setChatInput("");
    await sendMessage(message);
    // Auto-scroll to bottom after new message
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading photo details...</Text>
      </View>
    );
  }

  if (error || !image) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || "Image not found"}</Text>
      </View>
    );
  }

  return (
    <>
      {/* Stack.Screen lets us set the header title dynamically */}
      <Stack.Screen
        options={{ title: image.suggestedName || image.name }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Full-size image */}
          {image.storagePath && (
            <Image source={{ uri: `${API_URL}/images/${image.id}/file` }} style={styles.fullImage} />
          )}

          {/* AI Analysis section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Analysis</Text>

            {image.suggestedName && (
              <Text style={styles.suggestedName}>{image.suggestedName}</Text>
            )}

            {image.description && (
              <Text style={styles.description}>{image.description}</Text>
            )}

            {/* Tags */}
            {image.tags && image.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {image.tags.map((tag, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Classifications */}
          {image.classifications && image.classifications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Classifications</Text>
              {image.classifications.map((clf) => (
                <View key={clf.id} style={styles.classificationCard}>
                  <Text style={styles.classificationTitle}>
                    {clf.typeName}
                  </Text>
                  {clf.properties?.map((prop, i) => (
                    <Text key={i} style={styles.property}>
                      <Text style={styles.propertyName}>
                        {prop.propertyName}:{" "}
                      </Text>
                      {prop.propertyContent}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Chat section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ask about this photo</Text>

            {/* Chat messages */}
            {chatMessages.map((msg, i) => (
              <View
                key={i}
                style={[
                  styles.chatBubble,
                  msg.role === "user"
                    ? styles.userBubble
                    : styles.assistantBubble,
                ]}
              >
                <Text
                  style={
                    msg.role === "user"
                      ? styles.userText
                      : styles.assistantText
                  }
                >
                  {msg.content}
                </Text>
              </View>
            ))}

            {chatLoading && (
              <View style={styles.chatLoading}>
                <ActivityIndicator size="small" color="#2196F3" />
                <Text style={styles.chatLoadingText}>Thinking...</Text>
              </View>
            )}

            {chatError && (
              <Text style={styles.chatError}>{chatError}</Text>
            )}
          </View>
        </ScrollView>

        {/* Chat input bar — fixed at the bottom */}
        <View style={styles.chatInputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder="Ask something about this photo..."
            value={chatInput}
            onChangeText={setChatInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!chatLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!chatInput.trim() || chatLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!chatInput.trim() || chatLoading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  errorText: {
    color: "#C62828",
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  fullImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: "#e0e0e0",
    resizeMode: "contain",
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  suggestedName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2196F3",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: "#1565C0",
    fontSize: 13,
  },
  classificationCard: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  classificationTitle: {
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  property: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },
  propertyName: {
    fontWeight: "600",
  },
  chatBubble: {
    maxWidth: "85%",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#2196F3",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
  },
  userText: {
    color: "#fff",
    fontSize: 15,
  },
  assistantText: {
    color: "#333",
    fontSize: 15,
    lineHeight: 22,
  },
  chatLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  chatLoadingText: {
    color: "#666",
  },
  chatError: {
    color: "#C62828",
    marginTop: 4,
  },
  chatInputContainer: {
    flexDirection: "row",
    padding: 12,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 8,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fff",
  },
  sendButton: {
    backgroundColor: "#2196F3",
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#B0BEC5",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
