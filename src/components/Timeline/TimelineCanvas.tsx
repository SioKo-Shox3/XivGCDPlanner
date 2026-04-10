import { useCallback, useRef, useEffect } from "react";
import { useAppStore } from "@/stores/timelineStore";
import { TimeRuler } from "./TimeRuler";
import { BossEventMarker } from "./BossEventMarker";
import { SkillBlock } from "./SkillBlock";
import { calculateGcdTime } from "@/services/tauriCommands";

export function TimelineCanvas() {
  const selectedTimeline = useAppStore((s) => s.selectedTimeline)();
  const selectedJob = useAppStore((s) => s.selectedJob)();
  const placements = useAppStore((s) => s.placements);
  const validationResult = useAppStore((s) => s.validationResult);
  const pps = useAppStore((s) => s.view.pixelsPerSecond);
  const spellSpeed = useAppStore((s) => s.spellSpeed);
  const addPlacement = useAppStore((s) => s.addPlacement);
  const setPixelsPerSecond = useAppStore((s) => s.setPixelsPerSecond);
  const endDrag = useAppStore((s) => s.endDrag);

  const scrollRef = useRef<HTMLDivElement>(null);

  const duration = selectedTimeline?.duration ?? 600;
  const totalWidth = duration * pps;

  const errorMap = new Map(
    validationResult?.errors.map((e) => [e.placementId, e.message]) ?? []
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -5 : 5;
        setPixelsPerSecond(pps + delta);
      }
    },
    [pps, setPixelsPerSecond]
  );

  // Zoom with ctrl+wheel needs passive: false
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/json");
      if (!raw) return;
      try {
        const { skillId, skillType } = JSON.parse(raw) as { skillId: number; skillType: "gcd" | "ability" };
        const rect = e.currentTarget.getBoundingClientRect();
        const scrollLeft = scrollRef.current?.scrollLeft ?? 0;
        const x = e.clientX - rect.left + scrollLeft;
        const time = Math.max(0, Math.round((x / pps) * 100) / 100);

        addPlacement({
          id: crypto.randomUUID(),
          skillId,
          skillType,
          time,
        });
      } catch {
        // invalid data
      }
      endDrag();
    },
    [pps, addPlacement, endDrag]
  );

  if (!selectedJob || !selectedTimeline) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: "var(--text-secondary)" }}>
        <p>ジョブとタイムラインを選択してください</p>
      </div>
    );
  }

  const gcdPlacements = placements.filter((p) => p.skillType === "gcd");
  const abilityPlacements = placements.filter((p) => p.skillType === "ability");

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-x-auto overflow-y-hidden"
      onWheel={onWheel}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="relative" style={{ width: totalWidth, minHeight: "100%" }}>
        {/* Time ruler */}
        <TimeRuler duration={duration} pps={pps} />

        {/* Boss events track */}
        <div className="relative h-8" style={{ background: "rgba(255,255,255,0.02)" }}>
          {selectedTimeline.events.map((evt, i) => (
            <BossEventMarker key={i} event={evt} pps={pps} />
          ))}
        </div>

        {/* GCD track */}
        <div className="relative h-16 border-t border-white/5" style={{ background: "rgba(59,130,246,0.05)" }}>
          <span className="absolute left-1 top-0.5 text-[10px] pointer-events-none z-10"
            style={{ color: "var(--gcd-color)", opacity: 0.5 }}>GCD</span>
          {gcdPlacements.map((p) => {
            const skill = selectedJob.skills.gcd.find((s) => s.id === p.skillId);
            if (!skill) return null;
            const gcdTime = calculateGcdTime(2.5, spellSpeed);
            return (
              <SkillBlock
                key={p.id}
                placement={p}
                name={skill.name}
                widthSeconds={gcdTime}
                castTime={skill.castTime < gcdTime ? skill.castTime : undefined}
                pps={pps}
                color="var(--gcd-color)"
                error={errorMap.get(p.id)}
              />
            );
          })}
        </div>

        {/* Ability track */}
        <div className="relative h-16 border-t border-white/5" style={{ background: "rgba(16,185,129,0.05)" }}>
          <span className="absolute left-1 top-0.5 text-[10px] pointer-events-none z-10"
            style={{ color: "var(--ability-color)", opacity: 0.5 }}>アビリティ</span>
          {abilityPlacements.map((p) => {
            const skill = selectedJob.skills.ability.find((s) => s.id === p.skillId);
            if (!skill) return null;
            return (
              <SkillBlock
                key={p.id}
                placement={p}
                name={skill.name}
                widthSeconds={0.7}
                pps={pps}
                color="var(--ability-color)"
                error={errorMap.get(p.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
