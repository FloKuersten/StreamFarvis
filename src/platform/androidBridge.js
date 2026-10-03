import { Capacitor } from "@capacitor/core";
import { App as NativeApp } from "@capacitor/app";
import { StreamFarvis as platform } from "./nativePlugin";

const isAndroid = Capacitor.getPlatform() === "android" || import.meta.env.VITE_ANDROID === "1";
const native = Capacitor.isNativePlatform();
// Preview credentials last only for this page lifetime. Android uses Keystore.
const previewKeys = new Map();
const noEvent = () => () => {};

if (isAndroid) {
  document.documentElement.classList.add("android-app");
  document.title = "StreamFarvis";
  window.electron = {
    getPlatform: async () => "android",
    getAppVersion: async () => "1.0.0",
    secureGet: async (key) => native ? (await platform.secureGet({ key })).value : previewKeys.get(key) ?? null,
    secureSet: async (key, value) => {
      if (native) return platform.secureSet({ key, value: value || null });
      if (value) previewKeys.set(key, value);
      else previewKeys.delete(key);
    },
    openExternal: async (url) => {
      const parsed = new URL(url);
      if (!["https:", "http:"].includes(parsed.protocol)) throw new Error("Only web links can be opened.");
      if (native) return platform.openExternal({ url: parsed.href });
      window.open(parsed.href, "_blank", "noopener,noreferrer");
    },
    // Desktop event channels have no producers on Android.
    onConfirmClose: noEvent, offConfirmClose: () => {},
    onDownloadProgress: noEvent, offDownloadProgress: () => {},
    onM3u8Found: noEvent, offM3u8Found: () => {},
    onSubtitleFound: noEvent, offSubtitleFound: () => {},
    getDownloads: async () => [],
    playerStopped: () => {},
    clearAppCache: async () => {},
  };

  if (native) {
    NativeApp.addListener("backButton", () => {
      const event = new CustomEvent("streamfarvis:back", { cancelable: true });
      if (window.dispatchEvent(event)) NativeApp.minimizeApp();
    });
  }
}
