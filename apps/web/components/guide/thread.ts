"use client";

import { useCallback, useSyncExternalStore } from "react";

// The Guide's thread, one per card, held outside React so the drawer (which the overlay
// mounts fresh each time it opens) picks its conversation back up. Nothing here is
// persisted or sent anywhere but the Guide's own route; a reload is a fresh thread.

export type GuideVerdict = "band" | "sit-out" | "none";

export type GuideMessage = {
  readonly id: number;
  readonly role: "you" | "guide";
  readonly text: string;
  /// Written but not spoken yet: the typewriter is still on it.
  readonly typing: boolean;
  /// A reply marked failed (no provider, provider error) never earns follow-up chips or
  /// an action card, and is drawn as a note rather than a read.
  readonly failed: boolean;
  readonly verdict: GuideVerdict;
  readonly band: number | null;
  readonly followUps: readonly string[];
};

export type GuideThread = {
  readonly messages: readonly GuideMessage[];
  readonly busy: boolean;
  readonly sends: number;
  readonly openedAt: number | undefined;
};

const EMPTY: GuideThread = { messages: [], busy: false, sends: 0, openedAt: undefined };
const threads = new Map<string, GuideThread>();
const listeners = new Set<() => void>();
let nextId = 1;

const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const read = (marketId: string): GuideThread => threads.get(marketId) ?? EMPTY;
const write = (marketId: string, next: GuideThread) => {
  threads.set(marketId, next);
  emit();
};

const message = (partial: Partial<GuideMessage> & Pick<GuideMessage, "role" | "text">): GuideMessage => ({
  id: nextId++,
  typing: false,
  failed: false,
  verdict: "none",
  band: null,
  followUps: [],
  ...partial,
});

type Reply = { readonly failed: boolean; readonly reply: string; readonly verdict?: GuideVerdict; readonly band?: number | null; readonly followUps?: readonly string[] };

export const useGuideThread = (marketId: string) => {
  const thread = useSyncExternalStore(subscribe, () => read(marketId), () => EMPTY);

  const opened = useCallback(() => {
    const held = read(marketId);
    if (held.openedAt === undefined) write(marketId, { ...held, openedAt: Date.now() });
  }, [marketId]);

  const spoken = useCallback((id: number) => {
    const held = read(marketId);
    write(marketId, { ...held, messages: held.messages.map((item) => (item.id === id ? { ...item, typing: false } : item)) });
  }, [marketId]);

  const send = useCallback(async (text: string) => {
    const held = read(marketId);
    if (held.busy || text.trim() === "") return;
    const yours = message({ role: "you", text: text.trim() });
    write(marketId, { ...held, busy: true, sends: held.sends + 1, messages: [...held.messages, yours] });
    const history = [...held.messages, yours]
      .filter((item) => !item.failed)
      .map((item) => ({ role: item.role === "you" ? "user" : "assistant", content: item.text }));
    let reply: Reply;
    try {
      const response = await fetch("/api/guide", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ marketId, messages: history }) });
      const parsed: unknown = await response.json().catch(() => undefined);
      reply = isReply(parsed) ? parsed : { failed: true, reply: "The Guide did not answer. Nothing about your card changed." };
    } catch {
      reply = { failed: true, reply: "The Guide could not be reached. Nothing about your card changed." };
    }
    const latest = read(marketId);
    write(marketId, {
      ...latest,
      busy: false,
      messages: [
        ...latest.messages,
        message({ role: "guide", text: reply.reply, typing: !reply.failed, failed: reply.failed, verdict: reply.verdict ?? "none", band: reply.band ?? null, followUps: reply.followUps ?? [] }),
      ],
    });
  }, [marketId]);

  return { thread, send, spoken, opened };
};

const isReply = (value: unknown): value is Reply =>
  typeof value === "object" && value !== null && "reply" in value && typeof (value as { reply: unknown }).reply === "string" && "failed" in value;
