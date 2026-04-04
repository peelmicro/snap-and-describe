/**
 * Home / Upload Screen
 *
 * This is the first tab. It shows two buttons:
 * 1. "Take Photo" — opens the device camera (mobile) or webcam (web)
 * 2. "Choose from Gallery" — opens the photo gallery (mobile) or file picker (web)
 *
 * After selecting an image, it:
 * 1. Shows the selected image as a preview
 * 2. Uploads it to the API (which stores it in MinIO and analyzes with Claude Vision)
 * 3. Displays the AI-generated description, tags, and classifications
 *
 * Key concepts:
 * - expo-image-picker: universal library that abstracts camera/gallery access
 *   across iOS, Android, and web. Same API everywhere.
 * - useState: React hook to store component state (selected image, upload result)
 * - The upload flow is: pick image → show preview → upload → show results
 */
import { useState, useEffect } from "react";
import {
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

import { Text, View } from "@/components/Themed";
import { useUpload } from "@/hooks/useApi";
import { getCapturedPhoto } from "@/hooks/useCapturedPhoto";

export default function HomeScreen() {
  // State for the selected image (before upload)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // State for the upload result (after upload)
  const [result, setResult] = useState<any>(null);

  const { loading: uploading, error: uploadError, execute: upload } = useUpload();

  // Check for photo returned from the camera screen
  useEffect(() => {
    const photo = getCapturedPhoto();
    if (photo) {
      setSelectedImage(photo.uri);
      setResult(null);
      const ext = photo.mimeType === "image/png" ? "png" : "jpg";
      (async () => {
        try {
          const response = await upload(photo.uri, `camera-photo.${ext}`, photo.mimeType);
          setResult(response);
        } catch {
          // Error handled by hook
        }
      })();
    }
  }, [upload]);

  /**
   * Opens the live camera screen.
   *
   * On all platforms (web, iOS, Android), this navigates to a full-screen
   * CameraView that uses getUserMedia on web or the native camera on mobile.
   * This gives a real live camera preview, unlike expo-image-picker which
   * on desktop web just opens a file picker.
   */
  const takePhoto = () => {
    router.push("/camera" as any);
  };

  /**
   * Opens the photo gallery / file picker.
   *
   * launchImageLibraryAsync() handles platform differences:
   * - iOS: opens the Photos app picker
   * - Android: opens the gallery/file manager
   * - Web: opens a native file picker dialog (<input type="file">)
   *
   * mediaTypes: restricts to images only (no videos)
   */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setSelectedImage(asset.uri);
    setResult(null);
    await handleUpload(asset.uri, asset.fileName || "photo.jpg", asset.mimeType || "image/jpeg");
  };

  /**
   * Uploads the selected image to the API.
   * The API will: store in MinIO → analyze with Claude Vision → return metadata.
   */
  const handleUpload = async (uri: string, filename: string, mimeType: string) => {
    try {
      const response = await upload(uri, filename, mimeType);
      setResult(response);
    } catch {
      // Error is already handled in the hook
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Snap & Describe</Text>
      <Text style={styles.subtitle}>
        Take a photo or choose one to get AI-powered analysis
      </Text>

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.cameraButton]}
          onPress={takePhoto}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.galleryButton]}
          onPress={pickImage}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>Upload Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Loading indicator during upload + AI analysis */}
      {uploading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>
            Uploading and analyzing with AI...
          </Text>
        </View>
      )}

      {/* Error message */}
      {uploadError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{uploadError}</Text>
        </View>
      )}

      {/* Preview of selected image */}
      {selectedImage && (
        <Image source={{ uri: selectedImage }} style={styles.preview} />
      )}

      {/* AI analysis results */}
      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>AI Analysis</Text>

          {result.suggestedName && (
            <Text style={styles.suggestedName}>{result.suggestedName}</Text>
          )}

          {result.description && (
            <Text style={styles.description}>{result.description}</Text>
          )}

          {result.tags && result.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {result.tags.map((tag: string, i: number) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Link to full detail screen */}
          {result.id && (
            <TouchableOpacity
              style={styles.detailButton}
              onPress={() => router.push(`/photo/${result.id}` as any)}
            >
              <Text style={styles.detailButtonText}>View Details & Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

/**
 * StyleSheet.create() — React Native's way of defining styles.
 *
 * Unlike web CSS, React Native uses JavaScript objects for styles.
 * Key differences from web CSS:
 * - No class names — styles are applied directly via the `style` prop
 * - Uses camelCase (backgroundColor, not background-color)
 * - Flexbox is the default layout (no need for display: flex)
 * - Units are density-independent pixels (dp), not px/rem/em
 * - No cascading — styles don't inherit from parent (except text color in Text)
 */
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    minWidth: 150,
    alignItems: "center",
  },
  cameraButton: {
    backgroundColor: "#2196F3",
  },
  galleryButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    width: "100%",
  },
  errorText: {
    color: "#C62828",
  },
  preview: {
    width: 300,
    height: 300,
    borderRadius: 12,
    marginVertical: 16,
  },
  resultContainer: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  suggestedName: {
    fontSize: 18,
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
    marginBottom: 16,
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
  detailButton: {
    backgroundColor: "#2196F3",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  detailButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
