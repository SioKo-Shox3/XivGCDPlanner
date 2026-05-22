import { Fragment } from "react";
import type { SkillPlacement, JobDef, AbilitySkillDef } from "@/types";

const LABEL_WIDTH = 96;
// Ability color from CSS variable (#34d399 = rgb 52 211 153)
const EFFECT_COLOR = "rgba(52, 211, 153, 0.55)";
const EFFECT_BORDER = "rgba(52, 211, 153, 0.75)";

interface RowProps {
  skill: AbilitySkillDef;
  placements: SkillPlacement[];
  pps: number;
  startTime: number;
}

function AbilityRow({ skill, placements, pps, startTime }: RowProps) {
  const hasEffect = skill.effectTime != null && skill.effectTime > 0;

  return (
    <div
      className="relative border-t"
      style={{
        height: 32,
        borderColor: "var(--border)",
        background: "var(--bg-primary)",
      }}
    >
      {placements.map((p) => {
        const x = (p.time - startTime) * pps;
        return (
          <Fragment key={p.id}>
            {/* Cooldown bar — bottom half */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: x,
                top: hasEffect ? "50%" : 4,
                bottom: 4,
                width: skill.recastTime * pps,
                background:
                  "repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(120,120,120,0.25) 3px, rgba(120,120,120,0.25) 6px)",
                border: "1px solid rgba(130,130,130,0.2)",
                borderRadius: 3,
                zIndex: 5,
              }}
            />
            {/* Effect time bar — top half (only when effectTime exists) */}
            {hasEffect && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: x,
                  top: 4,
                  height: "44%",
                  width: skill.effectTime! * pps,
                  background: EFFECT_COLOR,
                  border: `1px solid ${EFFECT_BORDER}`,
                  borderRadius: 3,
                  zIndex: 6,
                }}
              />
            )}
            {/* Icon marker at the exact placement time */}
            <div
              className="absolute flex items-center justify-center pointer-events-none"
              style={{
                left: x,
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
        );
      })}

      {/* Sticky ability label */}
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
  startTime: number;
}

export function AbilityTimelineRows({ placements, job, pps, startTime }: Props) {
  const abilityPlacements = placements.filter((p) => p.skillType === "ability");
  if (abilityPlacements.length === 0) return null;

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

      {uniqueIds.map((skillId) => {
        const skill = job.skills.ability.find((s) => s.id === skillId);
        if (!skill) return null;
        const skillPlacements = abilityPlacements.filter((p) => p.skillId === skillId);
        return (
          <AbilityRow key={skillId} skill={skill} placements={skillPlacements} pps={pps} startTime={startTime} />
        );
      })}
    </div>
  );
}