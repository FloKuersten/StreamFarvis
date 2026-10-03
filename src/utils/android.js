import { Capacitor } from "@capacitor/core";
import { StreamFarvis } from "../platform/nativePlugin";
import { NON_ANIME_DEFAULT_SOURCE, PLAYER_SOURCES } from "./api";

// The build flag also makes the Android layout available in a browser preview.
export const IS_ANDROID =
  Capacitor.isNativePlatform() || import.meta.env.VITE_ANDROID === "1";

// AllManga depends on Electron IPC. Android uses the upstream TMDB providers
// for both animation and live-action titles.
export const ANDROID_PLAYER_SOURCES = PLAYER_SOURCES.filter(
  (source) => !source.async && !source.tag,
);

export function getAndroidSource(sourceId) {
  return ANDROID_PLAYER_SOURCES.some((source) => source.id === sourceId)
    ? sourceId
    : NON_ANIME_DEFAULT_SOURCE;
}

export async function openAndroidPlayer({ url, title }) {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Install the Android APK to open the player. This is the browser preview.");
  }
  await StreamFarvis.openPlayer({ url, title });
}
