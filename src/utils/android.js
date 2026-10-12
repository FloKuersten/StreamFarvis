import { Capacitor } from "@capacitor/core";
import { StreamFarvis } from "../platform/nativePlugin";
import { NON_ANIME_DEFAULT_SOURCE, PLAYER_SOURCES } from "./api";

const platform = Capacitor.getPlatform();
export const IS_ANDROID =
  platform === "android" || import.meta.env.VITE_ANDROID === "1";
export const IS_IOS =
  platform === "ios" || import.meta.env.VITE_IOS === "1";
export const IS_MOBILE =
  IS_ANDROID || IS_IOS || Capacitor.isNativePlatform();

// AllManga depends on Electron IPC. Mobile platforms use upstream TMDB providers
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
    throw new Error("Install the Android APK or iOS app to open the player. This is the browser preview.");
  }
  await StreamFarvis.openPlayer({ url, title });
}
