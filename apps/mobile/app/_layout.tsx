/**
 * Root Layout — wraps the entire app.
 *
 * How the navigation hierarchy works in Expo Router:
 *
 * Root Layout (this file — Stack navigator)
 *   ├── (tabs) — Tab navigator (bottom bar)
 *   │   ├── index.tsx — Upload tab
 *   │   └── gallery.tsx — Gallery tab
 *   └── photo/[id].tsx — Photo detail (pushes on top of tabs)
 *
 * Stack navigator: screens push on top of each other (like a deck of cards).
 * When you navigate from Gallery → Photo Detail, the detail screen slides in
 * from the right, and there's a back button to go back.
 *
 * This file also:
 * - Loads custom fonts (SpaceMono + FontAwesome icons)
 * - Sets up light/dark theme based on system preference
 * - Shows a splash screen while fonts are loading
 */
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Tabs — hidden header because tabs have their own headers */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "Back" }} />
        {/* Camera — full screen, no header */}
        <Stack.Screen
          name="camera"
          options={{ headerShown: false, presentation: "fullScreenModal" }}
        />
        {/* Photo detail — shows with back button */}
        <Stack.Screen
          name="photo/[id]"
          options={{ title: "Photo Details" }}
        />
      </Stack>
    </ThemeProvider>
  );
}
