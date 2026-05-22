import type { SkillPlacement } from "@/types";

interface Props {
  placement: SkillPlacement;
  pps: number;
  recastTime: number;
  effectTime?: number;
  color: string;
}

const ANIM_LOCK = 0.7;

export function AbilityCooldownOverlay({ placement, pps, recastTime, effectTime, color }: Props) {
  const cdStart = placement.time + ANIM_LOCK;
  const cdWidth = Math.max(0, (recastTime - ANIM_LOCK) * pps);

  return (
    <>
      {/* Effect time bar — rendered below the icon, shows buff duration */}
      {effectTime != null && effectTime > 0 && (
        <div
          className="absolute top-1.5 bottom-1.5 rounded pointer-events-none"
          style={{
            left: placement.time * pps,
            width: effectTime * pps,
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
            zIndex: 3,
          }}
        />
      )}
      {/* Cooldown bar — shows the period the ability cannot be used again */}
      {cdWidth > 0 && (
        <div
          className="absolute top-1.5 bottom-1.5 pointer-events-none"
          style={{
            left: cdStart * pps,
            width: cdWidth,
            background:
              "repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(120,120,120,0.2) 3px, rgba(120,120,120,0.2) 6px)",
            borderTop: "1px solid rgba(160,160,160,0.18)",
            borderBottom: "1px solid rgba(160,160,160,0.18)",
            borderRight: "1px solid rgba(160,160,160,0.25)",
            borderRadius: "0 4px 4px 0",
            zIndex: 4,
          }}
        />
      )}
    </>
  );
}
