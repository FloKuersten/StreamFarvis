import { Capacitor } from "@capacitor/core";
import { App as NativeApp } from "@capacitor/app";
import { StreamFarvis as platform } from "./nativePlugin";

const platformName = Capacitor.getPlatform();
const isAndroid = platformName === "android" || import.meta.env.VITE_ANDROID === "1";
const isIOS = platformName === "ios" || import.meta.env.VITE_IOS === "1";
const isMobile = isAndroid || isIOS || Capacitor.isNativePlatform();
const native = Capacitor.isNativePlatform();
// Preview credentials last only for this page lifetime.
const previewKeys = new Map();
const noEvent = () => () => {};

if (isMobile) {
  document.documentElement.classList.add("android-app", "mobile-app");
  if (isIOS) document.documentElement.classList.add("ios-app");
  document.title = "StreamFarvis";
  window.electron = {
    getPlatform: async () => (isIOS ? "ios" : "android"),
    getAppVersion: async () => "1.0.1",
    secureGet: async (key) => {
      if (native) {
        try {
          const res = await platform.secureGet({ key });
          return res ? res.value : null;
        } catch {
          return previewKeys.get(key) ?? null;
        }
      }
      return previewKeys.get(key) ?? null;
    },
    secureSet: async (key, value) => {
      if (native) {
        try {
          return await platform.secureSet({ key, value: value || null });
        } catch {
          if (value) previewKeys.set(key, value);
          else previewKeys.delete(key);
          return;
        }
      }
      if (value) previewKeys.set(key, value);
      else previewKeys.delete(key);
    },
    openExternal: async (url) => {
      const parsed = new URL(url);
      if (!["https:", "http:"].includes(parsed.protocol)) throw new Error("Only web links can be opened.");
      if (native) {
        try {
          return await platform.openExternal({ url: parsed.href });
        } catch {}
      }
      window.open(parsed.href, "_blank", "noopener,noreferrer");
    },
    // Desktop event channels have no producers on mobile.
    onConfirmClose: noEvent, offConfirmClose: () => {},
    onDownloadProgress: noEvent, offDownloadProgress: () => {},
    onM3u8Found: noEvent, offM3u8Found: () => {},
    onSubtitleFound: noEvent, offSubtitleFound: () => {},
    getDownloads: async () => [],
    playerStopped: () => {},
    clearAppCache: async () => {},
  };

  if (native && isAndroid) {
    NativeApp.addListener("backButton", () => {
      const event = new CustomEvent("streamfarvis:back", { cancelable: true });
      if (window.dispatchEvent(event)) NativeApp.minimizeApp();
    });
  }
}
