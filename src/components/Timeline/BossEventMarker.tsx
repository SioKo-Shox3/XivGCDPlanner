import type { BossEvent } from "@/types";

const typeColors: Record<string, string> = {
  raidwide: "var(--boss-raidwide)",
  tankbuster: "var(--boss-tankbuster)",
  mechanic: "var(--boss-mechanic)",
  enrage: "var(--boss-enrage)",
  downtime: "var(--boss-downtime)",
};

interface Props {
  event: BossEvent;
  pps: number;
}

export function BossEventMarker({ event, pps }: Props) {
  const color = typeColors[event.type] ?? "var(--boss-mechanic)";
  const left = event.time * pps;
  const width = event.castTime ? event.castTime * pps : 2;

  return (
    <div
      className="absolute top-1 bottom-1 rounded-sm flex items-center overflow-hidden cursor-default"
      style={{
        left,
        width: Math.max(width, 2),
        background: `${color}33`,
        borderLeft: `2px solid ${color}`,
      }}
      title={`${event.name} (${event.time}s)\n${event.type}${event.description ? "\n" + event.description : ""}`}
    >
      <span className="text-[9px] px-1 whitespace-nowrap truncate" style={{ color }}>
        {event.name}
      </span>
    </div>
  );
}
