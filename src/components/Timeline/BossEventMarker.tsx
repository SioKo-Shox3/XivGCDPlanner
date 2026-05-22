import type { BossEvent } from "@/types";

const typeColors: Record<string, string> = {
  raidwide: "var(--boss-raidwide)",
  tankbuster: "var(--boss-tankbuster)",
  mechanic: "var(--boss-mechanic)",
  enrage: "var(--boss-enrage)",
  downtime: "var(--boss-downtime)",
};

const typeLabels: Record<string, string> = {
  raidwide: "全体",
  tankbuster: "TB",
  mechanic: "ギミック",
  enrage: "エンレイジ",
  downtime: "無敵",
};

const typeFullNames: Record<string, string> = {
  raidwide: "全体攻撃",
  tankbuster: "タンクバスター",
  mechanic: "ギミック",
  enrage: "エンレイジ",
  downtime: "ダウンタイム",
};

interface Props {
  event: BossEvent;
  pps: number;
  startTime: number;
}

export function BossEventMarker({ event, pps, startTime }: Props) {
  const color = typeColors[event.type] ?? "var(--boss-mechanic)";
  const label = typeLabels[event.type] ?? "ギミック";
  const fullName = typeFullNames[event.type] ?? "ギミック";
  const left = (event.time - startTime) * pps;
  const width = event.castTime ? event.castTime * pps : 2;

  return (
    <div
      className="absolute top-1 bottom-1 rounded-sm flex items-center cursor-default"
      style={{
        left,
        width: Math.max(width, 2),
        background: `${color}22`,
        borderLeft: `2px solid ${color}`,
      }}
      title={`[${fullName}] ${event.name} (${event.time}s)${event.castTime ? ` 詠唱: ${event.castTime}s` : ""}${event.description ? "\n" + event.description : ""}`}
    >
      <span className="text-[9px] px-1 whitespace-nowrap leading-none pointer-events-none" style={{ color }}>
        <span className="opacity-70">[{label}]</span>{" "}{event.name}
      </span>
    </div>
  );
}
