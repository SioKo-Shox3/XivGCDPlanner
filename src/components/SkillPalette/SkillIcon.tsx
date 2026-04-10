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
      className="flex flex-col items-center rounded cursor-grab active:cursor-grabbing transition-transform hover:scale-105"
      title={`${skill.name}\n${"potency" in skill ? `威力: ${skill.potency}` : `リキャスト: ${"recastTime" in skill ? (skill as AbilitySkillDef).recastTime : "?"}s`}\n${skill.description}`}
    >
      <div
        className="w-12 h-12 rounded border-2 flex items-center justify-center text-xs font-bold overflow-hidden"
        style={{
          borderColor,
          background: "var(--bg-surface)",
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
        <span className={skill.icon ? "hidden" : ""} style={{ fontSize: "10px", textAlign: "center" }}>
          {skill.name.slice(0, 4)}
        </span>
      </div>
      <span className="text-[10px] mt-0.5 text-center leading-tight w-full truncate px-0.5"
        style={{ color: "var(--text-secondary)" }}>
        {skill.name}
      </span>
    </div>
  );
}
