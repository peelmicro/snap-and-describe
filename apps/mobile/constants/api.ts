import { Platform } from "react-native";

/**
 * API base URL configuration.
 *
 * On web: the browser runs on localhost, so localhost:3000 works directly.
 * On Android emulator: "localhost" refers to the emulator itself, not your machine.
 *   Android uses 10.0.2.2 as an alias for the host machine's localhost.
 * On iOS simulator: localhost works because the simulator shares the host network.
 * On physical devices: use your machine's local IP address.
 */
// For physical devices, use your machine's local IP address.
// For emulators/simulators/web, localhost or 10.0.2.2 works.
const LOCAL_IP = "192.168.1.65";

export const API_URL =
  Platform.OS === "web"
    ? "http://localhost:3000"
    : `http://${LOCAL_IP}:3000`;
