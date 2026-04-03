/**
 * Camera Screen — live camera preview with capture button.
 *
 * Uses expo-camera's CameraView component which:
 * - On mobile (iOS/Android): renders the native camera feed
 * - On web: uses getUserMedia API to access the webcam
 *
 * This is different from expo-image-picker's launchCameraAsync() which
 * on desktop web just opens a file picker. CameraView gives a real
 * live preview on all platforms.
 *
 * Flow:
 * 1. Request camera permission
 * 2. Show live preview with CameraView
 * 3. User taps capture button → takes a photo
 * 4. Navigate back to home with the photo URI as a parameter
 *
 * Key concepts:
 * - CameraView: the component that renders the camera feed
 * - useCameraPermissions(): hook that manages permission state
 * - takePictureAsync(): captures a frame from the live feed as a JPEG
 * - ref: React ref to access the CameraView instance methods
 * - facing: "front" (selfie) or "back" (rear camera)
 */
import { useState, useRef } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, Stack } from "expo-router";

import { Text, View } from "@/components/Themed";
import { setCapturedPhoto } from "@/hooks/useCapturedPhoto";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Permission not yet determined
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <>
        <Stack.Screen options={{ title: "Camera" }} />
        <View style={styles.centered}>
          <Text style={styles.permissionText}>
            Camera access is needed to take photos.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      if (photo) {
        // Detect mime type from the URI
        // data: URIs start with "data:image/png;base64,..." or "data:image/jpeg;..."
        // file: URIs use the extension
        let mimeType = "image/jpeg";
        if (photo.uri.startsWith("data:image/png")) {
          mimeType = "image/png";
        } else if (photo.uri.startsWith("data:image/webp")) {
          mimeType = "image/webp";
        } else if (photo.uri.endsWith(".png")) {
          mimeType = "image/png";
        }

        // Store in shared memory (too large for URL params)
        setCapturedPhoto({ uri: photo.uri, mimeType });
        router.replace("/(tabs)" as any);
      }
    } catch (err) {
      console.error("Failed to capture:", err);
    } finally {
      setCapturing(false);
    }
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  return (
    <>
      <Stack.Screen options={{ title: "Take Photo", headerShown: false }} />
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        >
          {/* Top bar with close and flip buttons */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.topButton}
              onPress={() => router.back()}
            >
              <Text style={styles.topButtonText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topButton}
              onPress={toggleFacing}
            >
              <Text style={styles.topButtonText}>Flip</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom bar with capture button */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[
                styles.captureButton,
                capturing && styles.captureButtonDisabled,
              ]}
              onPress={takePicture}
              disabled={capturing}
            >
              {capturing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  camera: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 16,
    backgroundColor: "transparent",
  },
  topButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  topButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: "#2196F3",
    fontSize: 16,
  },
});
