"use client";

// The Block Draw instrument (design frame A: a black target-block bar, five sealed 3:4
// windows that lift when pressed and show the draw once the block exists). The draw is
// fixed by a block not mined yet, and the card says so under the windows.

export type WindowsProps = {
  readonly ranges: readonly string[];
  readonly selected: number | undefined;
  readonly onSelect: (optionIndex: number) => void;
  readonly disabled: boolean;
  readonly settleBlock: number | undefined;
  readonly blocksToGo: number | undefined;
  readonly revealed: { readonly optionIndex: number; readonly value: string } | undefined;
  readonly compact?: boolean;
};

export function Windows({ ranges, selected, onSelect, disabled, settleBlock, blocksToGo, revealed, compact = false }: WindowsProps) {
  const pill =
    revealed !== undefined ? "MINED" : blocksToGo === undefined ? "COUNTING" : `${blocksToGo.toLocaleString("en-US")} ${compact ? "TO GO" : "BLOCKS TO GO"}`;
  return (
    <div className={compact ? "mt-3" : "mt-[18px]"}>
      <div className={`flex items-center justify-between rounded-[12px] border-[3px] border-ink bg-ink ${compact ? "px-3 py-[9px]" : "px-[15px] py-[11px]"}`}>
        <span className={`font-data tracking-[.16em] text-stock-4 ${compact ? "text-[8px]" : "text-[9.5px]"}`}>{compact ? "TARGET BLOCK" : "TARGET BLOCK · SEPOLIA"}</span>
        <span className={`font-data font-bold text-stock ${compact ? "text-[14px]" : "text-[17px]"}`}>
          {settleBlock === undefined ? "\u2013" : settleBlock.toLocaleString("en-US")}
        </span>
        <span className={`rounded-full bg-stock font-data tracking-[.14em] text-(--fam) ${compact ? "px-[7px] py-[3px] text-[8px]" : "px-2 py-1 text-[9.5px]"}`}>{pill}</span>
      </div>
      <div role="radiogroup" aria-label="Choose a window" className={`grid grid-cols-5 ${compact ? "mt-2.5 gap-1.5" : "mt-3 gap-2"}`}>
        {ranges.map((range, index) => {
          const sel = selected === index;
          const won = revealed?.optionIndex === index;
          return (
            <button
              key={range}
              type="button"
              role="radio"
              aria-checked={sel}
              aria-label={`Window ${index + 1}, ${range}`}
              disabled={disabled}
              onClick={() => onSelect(index)}
              className={`flex aspect-[3/4] flex-col items-center justify-center rounded-[12px] border-[3px] border-ink transition-transform duration-150 ${compact ? "gap-1 rounded-[10px]" : "gap-2 hover:-translate-y-[5px]"} ${sel ? "-translate-y-1.5 bg-(--fam)" : won ? "bg-(--fam-soft)" : revealed === undefined ? "window-sealed" : "bg-transparent"}`}
            >
              <span className={`font-display font-extrabold ${compact ? "text-[18px]" : "text-[26px]"} ${sel ? "text-stock" : "text-ink"}`}>{index + 1}</span>
              {compact ? null : <span className={`font-data text-[8.5px] tracking-[.1em] ${sel ? "text-stock/80" : "text-stock-3"}`}>{range}</span>}
              {won ? <span className={`font-data font-bold ${compact ? "text-[7.5px]" : "text-[10px]"} ${sel ? "text-stock" : "text-ink"}`}>{revealed?.value}</span> : null}
            </button>
          );
        })}
      </div>
      {compact ? null : (
        <p className="mt-[11px] font-data text-[9.5px] tracking-[.1em] text-stock-3">
          FIVE SEALED WINDOWS · THE DRAW IS FIXED BY A BLOCK NOT MINED YET
        </p>
      )}
    </div>
  );
}
