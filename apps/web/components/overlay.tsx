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
  /// The label of the sheet on screen, so an opener can tell whether it is the one open
  /// (the Guide's teaser bubbles stay quiet while its drawer is up).
  readonly sheetLabel: string | undefined;
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
    <OverlayContext.Provider value={{ openSheet, closeSheet, toast, sheetLabel: sheet?.label }}>
      {children}
      {sheet === undefined ? null : (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close"
            onClick={closeSheet}
            className="absolute inset-0 h-full w-full cursor-default bg-[rgba(4,10,7,.62)]"
          />
          <div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={sheet.label}
            tabIndex={-1}
            className="safe-bottom card-back absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-[22px] border-[3px] border-b-0 border-ink p-5 text-felt-text outline-none sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[420px] sm:rounded-none sm:border-y-0 sm:border-r-0 sm:border-l-[3px]"
          >
            <div className="mb-5 flex items-center justify-between border-b-2 border-gold/30 pb-4">
              <span className="font-data text-[10px] tracking-[.2em] text-gold">{sheet.label}</span>
              <button
                type="button"
                onClick={closeSheet}
                className="rounded-full border border-felt-3/60 px-2.5 py-0.5 font-data text-[9.5px] tracking-[.14em] text-felt-2 hover:text-felt-text"
              >
                CLOSE
              </button>
            </div>
            {sheet.node}
          </div>
        </div>
      )}
      {toastText === undefined ? null : (
        <output className="safe-bottom fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full border-2 border-ink-green bg-stock px-4 py-2 font-data text-[10.5px] tracking-[.08em] text-ink sm:bottom-6">
          {toastText}
        </output>
      )}
    </OverlayContext.Provider>
  );
}
