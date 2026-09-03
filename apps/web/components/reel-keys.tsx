"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Reels navigation that is not mouse-only (Story 3.9): arrow keys, j and k, and a
// horizontal swipe, all landing on the same bounded hrefs the visible controls use. There
// is no transition to suppress under reduced motion because moving between Markets is a
// navigation, not an animation: it is already instant for everyone.

const SWIPE_MIN_PX = 48;

export function ReelKeys({
  prevHref,
  nextHref,
}: {
  // Explicitly `| undefined` rather than optional: at the ends of a bounded feed there is
  // genuinely no neighbour, and exactOptionalPropertyTypes makes that a stated fact.
  prevHref: string | undefined;
  nextHref: string | undefined;
}) {
  const router = useRouter();
  useEffect(() => {
    const go = (href: string | undefined): void => {
      if (href !== undefined) router.push(href, { scroll: false });
    };
    const onKey = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      // Never steal a key from something the visitor is typing into or operating.
      if (target !== null && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "j") go(nextHref);
      if (event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "k") go(prevHref);
    };
    let startX = 0;
    let startY = 0;
    const onStart = (event: TouchEvent): void => {
      startX = event.changedTouches[0]?.clientX ?? 0;
      startY = event.changedTouches[0]?.clientY ?? 0;
    };
    const onEnd = (event: TouchEvent): void => {
      const deltaX = (event.changedTouches[0]?.clientX ?? 0) - startX;
      const deltaY = (event.changedTouches[0]?.clientY ?? 0) - startY;
      // Horizontal intent only: a vertical drag is the visitor reading the page.
      if (Math.abs(deltaX) < SWIPE_MIN_PX || Math.abs(deltaX) < Math.abs(deltaY)) return;
      go(deltaX < 0 ? nextHref : prevHref);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [prevHref, nextHref, router]);
  return null;
}
