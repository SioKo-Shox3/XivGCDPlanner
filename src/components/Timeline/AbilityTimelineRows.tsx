import { Fragment } from "react";
import type { SkillPlacement, JobDef, AbilitySkillDef } from "@/types";

const LABEL_WIDTH = 96;

interface RowProps {
  skill: AbilitySkillDef;
  placements: SkillPlacement[];
  pps: number;
}

function AbilityRow({ skill, placements, pps }: RowProps) {
  return (
    <div
      className="relative border-t"
      style={{
        height: 28,
        borderColor: "var(--border)",
        background: "var(--bg-primary)",
      }}
    >
      {/* Bars and icon markers per placement */}
      {placements.map((p) => (
        <Fragment key={p.id}>
          {/* Cooldown bar: spans recastTime from placement */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: p.time * pps,
              top: 4,
              bottom: 4,
              width: skill.recastTime * pps,
              background:
                "repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(120,120,120,0.22) 3px, rgba(120,120,120,0.22) 6px)",
              border: "1px solid rgba(130,130,130,0.2)",
              borderRadius: 3,
              zIndex: 5,
            }}
          />
          {/* Effect time bar: spans effectTime from placement, on top of cooldown */}
          {skill.effectTime != null && skill.effectTime > 0 && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: p.time * pps,
                top: 4,
                bottom: 4,
                width: skill.effectTime * pps,
                background: "color-mix(in srgb, var(--ability-color) 28%, transparent)",
                border: "1px solid color-mix(in srgb, var(--ability-color) 55%, transparent)",
                borderRadius: 3,
                zIndex: 6,
              }}
            />
          )}
          {/* Icon marker at the exact placement time */}
          <div
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              left: p.time * pps,
              top: 0,
              bottom: 0,
              width: 20,
              zIndex: 8,
            }}
          >
            {skill.icon && (
              <img
                src={skill.icon}
                alt={skill.name}
                draggable={false}
                className="w-4 h-4 rounded-sm"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
              />
            )}
          </div>
        </Fragment>
      ))}

      {/* Sticky ability label — always visible at the left edge while scrolling */}
      <div
        className="absolute top-0 bottom-0 flex items-center gap-1.5 px-1.5 border-r pointer-events-none"
        style={{
          position: "sticky",
          left: 0,
          width: LABEL_WIDTH,
          zIndex: 12,
          background: "var(--bg-elevated)",
          borderColor: "var(--border)",
        }}
      >
        {skill.icon && (
          <img
            src={skill.icon}
            alt=""
            draggable={false}
            className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
          />
        )}
        <span className="text-[9px] font-medium truncate" style={{ color: "var(--text-muted)" }}>
          {skill.name}
        </span>
      </div>
    </div>
  );
}

interface Props {
  placements: SkillPlacement[];
  job: JobDef;
  pps: number;
}

export function AbilityTimelineRows({ placements, job, pps }: Props) {
  const abilityPlacements = placements.filter((p) => p.skillType === "ability");
  if (abilityPlacements.length === 0) return null;

  // Collect unique ability IDs in the order they first appear
  const seen = new Set<number>();
  const uniqueIds: number[] = [];
  for (const p of abilityPlacements) {
    if (!seen.has(p.skillId)) {
      seen.add(p.skillId);
      uniqueIds.push(p.skillId);
    }
  }

  return (
    <div className="border-t" style={{ borderColor: "var(--border)" }}>
      {/* Section header */}
      <div
        className="flex items-center border-b"
        style={{
          height: 20,
          background: "rgba(255,255,255,0.015)",
          borderColor: "var(--border)",
        }}
      >
        <div
          className="flex items-center px-2 h-full border-r"
          style={{
            position: "sticky",
            left: 0,
            width: LABEL_WIDTH,
            zIndex: 12,
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}
        >
          <span
            className="text-[9px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--ability-color)", opacity: 0.5 }}
          >
            ABILITY CD
          </span>
        </div>
      </div>

      {/* One row per unique placed ability */}
      {uniqueIds.map((skillId) => {
        const skill = job.skills.ability.find((s) => s.id === skillId);
        if (!skill) return null;
        const skillPlacements = abilityPlacements.filter((p) => p.skillId === skillId);
        return (
          <AbilityRow key={skillId} skill={skill} placements={skillPlacements} pps={pps} />
        );
      })}
    </div>
  );
}
