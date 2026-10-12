import { useEffect, useRef, useState } from "react";
import { BTN, useGamepadLoop } from "./gamepad";
import {
  moveGamepadFocus,
  confirmGamepadFocus,
  dismissActiveOverlay,
  ensureInitialFocus,
  clearGamepadFocus,
} from "./gamepadSpatialNav";
import { isPlayerGamepadActive } from "./gamepadPlayerState";

/**
 * App-wide gamepad → UI navigation. Mount once near the root (App.jsx).
 *
 *  D-pad / left stick  → move focus between cards, buttons, links
 *  A (Xbox) / Cross    → activate the focused element
 *  B (Xbox) / Circle   → close the open modal, else navigate back
 *  Start                → open search
 *
 * Automatically no-ops whenever a video is playing, since the webview
 * takes over gamepad input for playback controls at that point. When
 * `enabled` is false (the "controller support" setting is off), no
 * requestAnimationFrame poll loop runs at all.
 */
export function useGamepadNav({ enabled, onBack, onOpenSearch }) {
  const [connected, setConnected] = useState(false);

  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const onOpenSearchRef = useRef(onOpenSearch);
  onOpenSearchRef.current = onOpenSearch;

  useGamepadLoop(
    {
      onConnectionChange: setConnected,
      onDirection: (dir) => {
        ensureInitialFocus();
        moveGamepadFocus(dir);
      },
      onButtonDown: (i) => {
        if (i === BTN.A) {
          ensureInitialFocus();
          confirmGamepadFocus();
        } else if (i === BTN.B) {
          if (!dismissActiveOverlay()) onBackRef.current?.();
        } else if (i === BTN.START) {
          onOpenSearchRef.current?.();
        }
      },
    },
    () => !isPlayerGamepadActive(),
    enabled, // gate the whole requestAnimationFrame poll loop, not just dispatch
  );

  useEffect(() => {
    if (!enabled) {
      clearGamepadFocus();
      setConnected(false);
      return;
    }

    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isInput = tag === "input" || tag === "textarea" || tag === "select";

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (isInput && !e.altKey && !e.metaKey) return;
        e.preventDefault();
        ensureInitialFocus();
        const dirMap = {
          ArrowUp: "up",
          ArrowDown: "down",
          ArrowLeft: "left",
          ArrowRight: "right",
        };
        moveGamepadFocus(dirMap[e.key]);
      } else if (e.key === "Enter" || e.key === "Select") {
        if (isInput) return;
        e.preventDefault();
        ensureInitialFocus();
        confirmGamepadFocus();
      } else if (e.key === "Escape" || e.key === "Backspace" || e.key === "GoBack") {
        if (isInput) return;
        if (dismissActiveOverlay()) {
          e.preventDefault();
        } else if (onBackRef.current) {
          e.preventDefault();
          onBackRef.current();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);

  return { connected };
}
