import { useEffect, useState } from "react";

/**
 * Deterrents only — see Watermark.tsx for why nothing here can actually
 * block a screenshot or screen recording. What this DOES stop:
 *  - Right-click "Save as" / "Inspect" shortcut, and text selection —
 *    stops casual copy-pasting of the table into WhatsApp/Notes.
 *  - Ctrl+P / Cmd+P — browser print dialog is blocked outright.
 *  - Returns `blurred`, which the caller applies as a CSS blur while the
 *    tab/window is unfocused — a mild deterrent against capture tools that
 *    only grab the active window, and stops shoulder-surfing when a
 *    student alt-tabs. It does not affect real screen-recording software.
 */
export function useContentProtection(containerRef: React.RefObject<HTMLElement | null>) {
  const [blurred, setBlurred] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const blockContextMenu = (e: MouseEvent) => e.preventDefault();
    const blockSelectStart = (e: Event) => e.preventDefault();
    const blockPrint = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
      }
    };
    const onBlur = () => setBlurred(true);
    const onFocus = () => setBlurred(false);
    const onVisibility = () => setBlurred(document.visibilityState !== "visible");

    el.addEventListener("contextmenu", blockContextMenu);
    el.addEventListener("selectstart", blockSelectStart);
    window.addEventListener("keydown", blockPrint);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      el.removeEventListener("contextmenu", blockContextMenu);
      el.removeEventListener("selectstart", blockSelectStart);
      window.removeEventListener("keydown", blockPrint);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [containerRef]);

  return { blurred };
}
