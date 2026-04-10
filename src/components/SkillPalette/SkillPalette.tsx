import { useAppStore } from "@/stores/timelineStore";
import { SkillIcon } from "./SkillIcon";

export function SkillPalette() {
  const selectedJob = useAppStore((s) => s.selectedJob)();

  if (!selectedJob) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 opacity-40">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>
        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>ジョブを選択してください</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <h2 className="text-[11px] font-semibold tracking-wider uppercase mb-3 px-0.5" style={{ color: "var(--text-muted)" }}>
        {selectedJob.name}
      </h2>

      <section className="mb-4">
        <h3 className="text-[10px] font-semibold tracking-wider uppercase mb-2.5 px-0.5 flex items-center gap-1.5" style={{ color: "var(--gcd-color)" }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--gcd-color)" }} />
          ウェポンスキル / 魔法
        </h3>
        <div className="grid grid-cols-4 gap-1">
          {selectedJob.skills.gcd.map((skill) => (
            <SkillIcon key={skill.id} skill={skill} skillType="gcd" />
          ))}
        </div>
      </section>

      <div className="my-3 border-t" style={{ borderColor: "var(--border)" }} />

      <section>
        <h3 className="text-[10px] font-semibold tracking-wider uppercase mb-2.5 px-0.5 flex items-center gap-1.5" style={{ color: "var(--ability-color)" }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--ability-color)" }} />
          アビリティ
        </h3>
        <div className="grid grid-cols-4 gap-1">
          {selectedJob.skills.ability.map((skill) => (
            <SkillIcon key={skill.id} skill={skill} skillType="ability" />
          ))}
        </div>
      </section>
    </div>
  );
}
