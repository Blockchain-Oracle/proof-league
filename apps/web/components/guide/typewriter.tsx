"use client";

import { useEffect, useState } from "react";
import { motionReduced } from "../../lib/settings.js";

// Masayume's typewriter, 24 ms per token: a reply is spoken, not dumped. Reduced motion
// prints it whole. `onDone` fires once so the thread can mark the message spoken and a
// reopened drawer prints it whole next time.

const STEP_MS = 24;

export function Typewriter({ text, live, onDone }: { text: string; live: boolean; onDone: () => void }) {
  const tokens = text.split(/(\s+)/);
  const [shown, setShown] = useState(live && !motionReduced() ? 0 : tokens.length);

  useEffect(() => {
    if (shown >= tokens.length) {
      if (live) onDone();
      return;
    }
    const timer = setTimeout(() => setShown((held) => held + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [shown, tokens.length, live, onDone]);

  return <>{tokens.slice(0, shown).join("")}</>;
}
