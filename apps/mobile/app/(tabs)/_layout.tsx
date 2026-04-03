/**
 * Tab Layout — defines the bottom tab navigation bar.
 *
 * How Expo Router tab navigation works:
 * - The <Tabs> component renders a bottom bar with icons
 * - Each <Tabs.Screen> maps to a file in the (tabs)/ folder
 * - The `name` prop must match the filename (without .tsx)
 * - `tabBarIcon` renders the icon for each tab
 * - `title` is shown in the tab bar and the header
 *
 * FontAwesome icons: we use the @expo/vector-icons package that comes
 * pre-installed with Expo. It bundles hundreds of icon fonts.
 * Browse available icons at: https://icons.expo.fyi/
 */
import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Upload",
          tabBarIcon: ({ color }) => <TabBarIcon name="camera" color={color} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: "Gallery",
          tabBarIcon: ({ color }) => <TabBarIcon name="th" color={color} />,
        }}
      />
    </Tabs>
  );
}
