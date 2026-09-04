import type { Family } from "../event/family.js";

// Each family's instrument, drawn as the deck draws it (design: THE DECK): a shape you
// can tell apart with the labels covered. Static and honest: these are card types, not
// live instruments, and the concept ones never claim a reading.

export function Silhouette({ family, selected }: { family: Family; selected?: number | undefined }) {
  const sel = selected ?? -1;
  switch (family.instrument) {
    case "gauge":
      return (
        <div className="mt-2.5 overflow-hidden rounded-[9px] border-2 border-ink">
          {[4, 3, 2, 1, 0].map((row) => (
            <div key={row} className={`h-[17px] border-b border-ink/15 last:border-b-0 ${row === (sel === -1 ? 2 : sel) ? "border-b-ink bg-(--fam)" : ""}`} />
          ))}
        </div>
      );
    case "windows":
      return (
        <div className="mt-2.5 grid grid-cols-5 gap-[5px]">
          {[0, 1, 2, 3, 4].map((window) => (
            <div key={window} className={`aspect-[3/4] rounded-md border-2 border-ink ${window === (sel === -1 ? 4 : sel) ? "bg-(--fam)" : "window-sealed"}`} />
          ))}
        </div>
      );
    case "chamber":
      return (
        <div className="mt-2.5 flex h-[85px] flex-col justify-end overflow-hidden rounded-t-[9px] rounded-b-[14px] border-2 border-ink">
          <div className="h-[26px] border-t border-dashed border-ink/30" />
          <div className="h-[22px] border-t border-ink bg-(--fam-soft)" />
          <div className="h-[34px] bg-(--fam)" />
        </div>
      );
    case "lanes":
      return (
        <div className="relative mt-2.5 flex flex-col gap-1.5">
          <div className="absolute inset-y-0 right-[14%] z-[1] w-[3px] bg-ink" />
          {[66, 38, 22].map((width, lane) => (
            <div key={lane} className="h-6 overflow-hidden rounded-md border-2 border-ink">
              <div className={`h-full bar-${Math.round(width / 100 * 12)} ${lane === 0 ? "bg-(--fam)" : "bg-(--fam-soft)"}`} />
            </div>
          ))}
        </div>
      );
    case "track":
      return (
        <div className="mt-2.5 flex h-[85px] flex-col justify-center gap-[9px]">
          <div className="relative h-3.5 overflow-hidden rounded-full border-2 border-ink">
            <div className="bar-9 h-full bg-(--fam)" />
            <div className="absolute left-[86%] -top-1 h-[18px] w-[3px] bg-ink" />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <div key={day} className={`h-[22px] rounded ${day >= 5 ? "border-2 border-dashed border-ink/40" : `border-2 border-ink ${day === 2 ? "bg-(--fam)" : ""}`}`} />
            ))}
          </div>
        </div>
      );
    case "ballot":
      return (
        <div className="mt-2.5 flex h-[85px] items-end gap-[7px]">
          <div className="flex h-full flex-1 flex-col justify-end overflow-hidden rounded-[7px] border-2 border-ink"><div className="h-[64%] bg-(--fam)" /></div>
          <div className="flex h-full flex-1 flex-col justify-end overflow-hidden rounded-[7px] border-2 border-ink"><div className="h-[28%] bg-(--fam-soft)" /></div>
          <div className="flex h-full flex-1 flex-col justify-end overflow-hidden rounded-[7px] border-2 border-dashed border-ink/40"><div className="h-[9%] bg-ink/20" /></div>
        </div>
      );
    case "territory":
      return (
        <div className="mt-2.5 grid h-[85px] grid-cols-[2fr_1fr_1fr] grid-rows-2 gap-[5px]">
          <div className="row-span-2 rounded-[7px] border-2 border-ink bg-(--fam)" />
          <div className="rounded-[7px] border-2 border-ink bg-(--fam-soft)" />
          <div className="rounded-[7px] border-2 border-ink" />
          <div className="rounded-[7px] border-2 border-ink" />
          <div className="rounded-[7px] border-2 border-dashed border-ink/40" />
        </div>
      );
    case "pulse":
      return (
        <div className="mt-2.5 flex h-[85px] items-end gap-[3px] rounded-[9px] border-2 border-ink p-2">
          {["h-[34%]", "h-[58%]", "h-[44%]", "h-[72%]", "h-[50%]", "h-[39%]", "h-[63%]"].map((height, bar) => (
            <div key={height} className={`flex-1 ${height} ${bar === 2 || bar === 4 ? "bg-(--fam)" : "bg-(--fam-soft)"}`} />
          ))}
        </div>
      );
  }
}
