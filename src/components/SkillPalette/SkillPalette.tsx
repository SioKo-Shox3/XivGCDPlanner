import { useAppStore } from "@/stores/timelineStore";
import { SkillIcon } from "./SkillIcon";

export function SkillPalette() {
  const selectedJob = useAppStore((s) => s.selectedJob)();

  if (!selectedJob) {
    return (
      <div className="p-4 text-center" style={{ color: "var(--text-secondary)" }}>
        <p className="text-sm">ジョブを選択してください</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text-secondary)" }}>
        {selectedJob.name}
      </h2>

      <section className="mb-4">
        <h3 className="text-xs font-semibold mb-2 px-1" style={{ color: "var(--gcd-color)" }}>
          ウェポンスキル / 魔法
        </h3>
        <div className="grid grid-cols-4 gap-1.5">
          {selectedJob.skills.gcd.map((skill) => (
            <SkillIcon key={skill.id} skill={skill} skillType="gcd" />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold mb-2 px-1" style={{ color: "var(--ability-color)" }}>
          アビリティ
        </h3>
        <div className="grid grid-cols-4 gap-1.5">
          {selectedJob.skills.ability.map((skill) => (
            <SkillIcon key={skill.id} skill={skill} skillType="ability" />
          ))}
        </div>
      </section>
    </div>
  );
}
