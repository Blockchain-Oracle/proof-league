"use client";

// The spot (design frame A): THE SPOT and the rack line, a felt pocket where tossed chips
// stack, PTS DOWN, three chip stacks with how many of each still fit, and CLEAR. On a
// phone (frame B) it is the chip rail: three chips and PTS DOWN in one row. Chips are
// today's free points; the pot is the Call's stake and nothing else.

export const CHIP_DENOMS = [10, 25, 50] as const;
export type ChipDenom = (typeof CHIP_DENOMS)[number];

export type SpotProps = {
  readonly pot: readonly ChipDenom[];
  readonly rackLeft: number | undefined;
  readonly rackTotal: number;
  readonly onToss: (chip: ChipDenom) => void;
  readonly onClear: () => void;
  readonly disabled: boolean;
  readonly compact?: boolean;
};

const chipClass = (chip: ChipDenom) => (chip === 10 ? "chip-10" : chip === 25 ? "chip-25" : "chip-50");

function Chip({ value, size }: { value: ChipDenom; size: "stack" | "pot" | "rail" }) {
  const outer = size === "pot" ? "h-14 w-14" : size === "rail" ? "h-10 w-10" : "h-11 w-11";
  const inner = size === "pot" ? "h-[34px] w-[34px] text-[13px]" : size === "rail" ? "h-6 w-6 text-[11px]" : "h-[27px] w-[27px] text-[12px]";
  return (
    <div className={`${chipClass(value)} ${outer} flex items-center justify-center rounded-full border-[3px] border-ink shadow-[0_4px_0_rgba(0,0,0,.36)]`}>
      <div className={`${inner} flex items-center justify-center rounded-full border-2 border-dashed border-ink/40 font-display font-extrabold text-ink`}>{value}</div>
    </div>
  );
}

export function TheSpot({ pot, rackLeft, rackTotal, onToss, onClear, disabled, compact = false }: SpotProps) {
  const down = pot.reduce((sum, chip) => sum + chip, 0);
  const left = rackLeft === undefined ? 0 : rackLeft - down;
  const haveOf = (chip: ChipDenom) => (rackLeft === undefined ? 0 : Math.max(0, Math.floor(left / chip)));

  if (compact) {
    return (
      <div className="mb-2.5 flex items-center gap-2">
        {CHIP_DENOMS.map((chip) => {
          const have = haveOf(chip);
          return (
            <button key={chip} type="button" disabled={disabled || have === 0} onClick={() => onToss(chip)} aria-label={`Put ${chip} points down`} className={have === 0 ? "opacity-35" : ""}>
              <Chip value={chip} size="rail" />
            </button>
          );
        })}
        {down > 0 ? (
          <button type="button" onClick={onClear} disabled={disabled} className="font-data text-[8px] tracking-[.1em] text-felt-2">CLEAR</button>
        ) : null}
        <div className="ml-auto text-right">
          <div className="font-display text-[21px] font-extrabold leading-none text-felt-text">{down}</div>
          <div className="mt-[3px] font-data text-[8px] tracking-[.12em] text-felt-2">PTS DOWN</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[9px]">
      <div className="flex items-baseline justify-between">
        <span className="font-data text-[9.5px] tracking-[.18em] text-felt-2">THE SPOT</span>
        <span className="font-data text-[9px] tracking-[.1em] text-felt-4">
          {rackLeft === undefined ? "TAKE A SEAT FOR A RACK" : `${left} / ${rackTotal} PTS IN RACK`}
        </span>
      </div>
      <div className="spot-pocket relative flex h-24 items-end justify-center rounded-[14px] border-2 border-gold/30 pb-3">
        {pot.length === 0 ? <span className="absolute top-[38px] font-data text-[9.5px] tracking-[.16em] text-felt-4">TAP A STACK TO BET</span> : null}
        <div className="relative h-[70px] w-[60px]">
          {pot.map((chip, index) => (
            <div key={`${chip}-${index}`} className={`anim-toss toss-${index % 10} pot-${index % 10} absolute left-0`}>
              <Chip value={chip} size="pot" />
            </div>
          ))}
        </div>
        <div className="absolute right-3 bottom-[11px] text-right">
          <div className="font-display text-[24px] font-extrabold leading-none tracking-[-.03em] text-felt-text">{down}</div>
          <div className="mt-[3px] font-data text-[8px] tracking-[.14em] text-felt-2">PTS DOWN</div>
        </div>
      </div>
      <div className="flex gap-[7px]">
        {CHIP_DENOMS.map((chip) => {
          const have = haveOf(chip);
          return (
            <button
              key={chip}
              type="button"
              disabled={disabled || have === 0}
              onClick={() => onToss(chip)}
              aria-label={`Put ${chip} points down, ${have} left`}
              className={`flex flex-1 flex-col items-center gap-[5px] transition-transform duration-150 ${have === 0 ? "translate-y-1 opacity-35" : "hover:-translate-y-[5px]"}`}
            >
              <Chip value={chip} size="stack" />
              <span className="font-data text-[8px] tracking-[.1em] text-felt-2">×{have}</span>
            </button>
          );
        })}
        <button type="button" onClick={onClear} disabled={disabled || pot.length === 0} className="flex flex-1 items-center justify-center rounded-[10px] border border-dashed border-white/20 font-data text-[9px] tracking-[.1em] text-felt-2">
          CLEAR
        </button>
      </div>
    </div>
  );
}
