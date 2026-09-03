"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// The shared overlay coordinator (FR-35, AD-36, REFERENCE-DESIGN §10): ONE blocking
// overlay at a time, opened by hand-off (a second open replaces the first, never
// stacks), closed by its visible control and Escape, focus returned to the opener, and
// at most one toast, which may echo durable state but never owns refusal, recovery,
// proof or signing state. Sheets respect the mobile safe area and bottom navigation.

type SheetRequest = { readonly label: string; readonly node: React.ReactNode };

type OverlayApi = {
  readonly openSheet: (label: string, node: React.ReactNode) => void;
  readonly closeSheet: () => void;
  readonly toast: (text: string) => void;
};

const OverlayContext = createContext<OverlayApi | undefined>(undefined);

export const useOverlay = (): OverlayApi => {
  const api = useContext(OverlayContext);
  if (api === undefined) throw new Error("useOverlay outside OverlayProvider");
  return api;
};

export function OverlayProvider({ children }: { children: React.ReactNode }) {
  const [sheet, setSheet] = useState<SheetRequest | undefined>(undefined);
  const [toastText, setToastText] = useState<string | undefined>(undefined);
  const opener = useRef<HTMLElement | undefined>(undefined);
  const panel = useRef<HTMLDivElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const openSheet = useCallback((label: string, node: React.ReactNode) => {
    // Hand-off, never a stack: remember the ORIGINAL opener only when nothing is open,
    // so a sheet-to-sheet transition still returns focus to where the user started.
    if (opener.current === undefined && document.activeElement instanceof HTMLElement) {
      opener.current = document.activeElement;
    }
    setSheet({ label, node });
  }, []);

  const closeSheet = useCallback(() => {
    setSheet(undefined);
    opener.current?.focus();
    opener.current = undefined;
  }, []);

  const toast = useCallback((text: string) => {
    if (toastTimer.current !== undefined) clearTimeout(toastTimer.current);
    setToastText(text);
    toastTimer.current = setTimeout(() => setToastText(undefined), 4000);
  }, []);

  useEffect(() => {
    if (sheet === undefined) return;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSheet();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheet, closeSheet]);

  return (
    <OverlayContext.Provider value={{ openSheet, closeSheet, toast }}>
      {children}
      {sheet === undefined ? null : (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close"
            onClick={closeSheet}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/30"
          />
          <div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={sheet.label}
            tabIndex={-1}
            className="safe-bottom absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto border-t border-rule bg-surface p-5 outline-none sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-96 sm:border-t-0 sm:border-l"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-sm font-semibold uppercase tracking-widest">{sheet.label}</span>
              <button
                type="button"
                onClick={closeSheet}
                className="border border-rule px-2 py-0.5 font-data text-[11px] uppercase tracking-widest text-ink-muted hover:text-ink"
              >
                Close
              </button>
            </div>
            {sheet.node}
          </div>
        </div>
      )}
      {toastText === undefined ? null : (
        <output className="safe-bottom fixed bottom-16 left-1/2 z-50 -translate-x-1/2 border border-rule bg-surface px-4 py-2 font-data text-xs sm:bottom-6">
          {toastText}
        </output>
      )}
    </OverlayContext.Provider>
  );
}
