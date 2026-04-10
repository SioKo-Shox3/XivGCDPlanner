import { useCallback } from "react";
import { useAppStore } from "@/stores/timelineStore";
import type { GcdSkillDef, AbilitySkillDef } from "@/types";

interface Props {
  skill: GcdSkillDef | AbilitySkillDef;
  skillType: "gcd" | "ability";
}

export function SkillIcon({ skill, skillType }: Props) {
  const startDrag = useAppStore((s) => s.startDrag);

  const borderColor = skillType === "gcd" ? "var(--gcd-color)" : "var(--ability-color)";

  const onDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData("application/json", JSON.stringify({ skillId: skill.id, skillType }));
      e.dataTransfer.effectAllowed = "copy";
      startDrag(skill.id, skillType);
    },
    [skill.id, skillType, startDrag]
  );

  const onDragEnd = useCallback(() => {
    useAppStore.getState().endDrag();
  }, []);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="flex flex-col items-center rounded-lg p-1.5 cursor-grab active:cursor-grabbing transition-all group"
      style={{ background: "transparent" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface-hover)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      title={`${skill.name}\n${"potency" in skill ? `威力: ${skill.potency}` : `リキャスト: ${"recastTime" in skill ? (skill as AbilitySkillDef).recastTime : "?"}s`}\n${skill.description}`}
    >
      <div
        className="w-10 h-10 rounded-md flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105"
        style={{
          background: "var(--bg-surface)",
          boxShadow: `inset 0 0 0 1px ${borderColor}33, var(--shadow-sm)`,
        }}
      >
        {skill.icon ? (
          <img
            src={skill.icon}
            alt={skill.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <span className={skill.icon ? "hidden" : ""}
          style={{ fontSize: "9px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, lineHeight: 1.2 }}>
          {skill.name.slice(0, 4)}
        </span>
      </div>
      <span className="text-[9px] mt-1 text-center leading-tight w-full truncate px-0.5"
        style={{ color: "var(--text-muted)", fontWeight: 500 }}>
        {skill.name}
      </span>
    </div>
  );
}
