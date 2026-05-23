import { useCallback, useRef, useEffect, useState } from "react";
import { useAppStore } from "@/stores/timelineStore";
import { TimeRuler } from "./TimeRuler";
import { BossEventMarker } from "./BossEventMarker";
import { SkillBlock } from "./SkillBlock";
import { AbilityTimelineRows } from "./AbilityTimelineRows";
import { PRE_PULL_SECONDS } from "@/constants";

const START_TIME = -PRE_PULL_SECONDS;

export function TimelineCanvas() {
  const selectedTimeline = useAppStore((s) => s.timelines.find((t) => t.id === s.selectedTimelineId));
  const selectedJob = useAppStore((s) => s.jobs.find((j) => j.id === s.selectedJobId));
  const placements = useAppStore((s) => s.placements);
  const validationResult = useAppStore((s) => s.validationResult);
  const pps = useAppStore((s) => s.view.pixelsPerSecond);
  const gcdTime = useAppStore((s) => s.gcdTime);
  const addPlacement = useAppStore((s) => s.addPlacement);
  const setPixelsPerSecond = useAppStore((s) => s.setPixelsPerSecond);
  const endDrag = useAppStore((s) => s.endDrag);
  const rangeStart = useAppStore((s) => s.rangeStart);
  const rangeEnd = useAppStore((s) => s.rangeEnd);
  const setRange = useAppStore((s) => s.setRange);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Shift+drag range selection state
  const [dragState, setDragState] = useState<{ startX: number; startTime: number } | null>(null);
  const [dragCurrentTime, setDragCurrentTime] = useState<number | null>(null);

  const duration = selectedTimeline?.duration ?? 600;
  const totalWidth = (duration - START_TIME) * pps;

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

  // Shift+drag range selection
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!e.shiftKey) return;
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const scrollLeft = scrollRef.current?.scrollLeft ?? 0;
      const x = e.clientX - rect.left + scrollLeft;
      const time = Math.max(START_TIME, Math.round((x / pps + START_TIME) * 100) / 100);
      setDragState({ startX: e.clientX, startTime: time });
      setDragCurrentTime(time);
    },
    [pps]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const scrollLeft = scrollRef.current?.scrollLeft ?? 0;
      const x = e.clientX - rect.left + scrollLeft;
      const time = Math.max(START_TIME, Math.round((x / pps + START_TIME) * 100) / 100);
      setDragCurrentTime(time);
    },
    [dragState, pps]
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const scrollLeft = scrollRef.current?.scrollLeft ?? 0;
      const x = e.clientX - rect.left + scrollLeft;
      const endTime = Math.max(START_TIME, Math.round((x / pps + START_TIME) * 100) / 100);
      const start = Math.min(dragState.startTime, endTime);
      const end = Math.max(dragState.startTime, endTime);
      if (end > start) {
        setRange(start, end);
      }
      setDragState(null);
      setDragCurrentTime(null);
    },
    [dragState, pps, setRange]
  );

  const onMouseLeave = useCallback(() => {
    if (dragState) {
      setDragState(null);
      setDragCurrentTime(null);
    }
  }, [dragState]);

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
        const time = Math.max(START_TIME, Math.round((x / pps + START_TIME) * 100) / 100);

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

  // Range overlay geometry
  const overlayStart = dragState
    ? Math.min(dragState.startTime, dragCurrentTime ?? dragState.startTime)
    : rangeStart;
  const overlayEnd = dragState
    ? Math.max(dragState.startTime, dragCurrentTime ?? dragState.startTime)
    : rangeEnd;
  const showOverlay =
    overlayStart !== null && overlayEnd !== null && overlayEnd > overlayStart;

  if (!selectedJob || !selectedTimeline) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="2" y1="12" x2="22" y2="12"/>
          <polyline points="15,5 22,12 15,19"/>
        </svg>
        <p className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>ジョブとタイムラインを選択してください</p>
      </div>
    );
  }

  const gcdPlacements = placements.filter((p) => p.skillType === "gcd");
  const abilityPlacements = placements.filter((p) => p.skillType === "ability");

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-x-auto overflow-y-auto"
      onWheel={onWheel}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      style={{ cursor: "default" }}
    >
      <div className="relative" style={{ width: totalWidth, minHeight: "100%" }}>
        {/* Time ruler */}
        <TimeRuler duration={duration} pps={pps} startTime={START_TIME} />

        {/* Boss events track */}
        <div className="relative h-8" style={{ background: "rgba(255,255,255,0.015)" }}>
          {selectedTimeline.events.map((evt, i) => (
            <BossEventMarker key={i} event={evt} pps={pps} startTime={START_TIME} />
          ))}
        </div>

        {/* GCD track */}
        <div className="relative h-16 border-t" style={{ background: "rgba(59,130,246,0.03)", borderColor: "var(--border)" }}>
          <span className="absolute left-1.5 top-0.5 text-[9px] font-semibold tracking-wider uppercase pointer-events-none z-10"
            style={{ color: "var(--gcd-color)", opacity: 0.4 }}>GCD</span>
          {gcdPlacements.map((p) => {
            const skill = selectedJob.skills.gcd.find((s) => s.id === p.skillId);
            if (!skill) return null;
            return (
              <SkillBlock
                key={p.id}
                placement={p}
                name={skill.name}
                icon={skill.icon}
                widthSeconds={gcdTime}
                castTime={skill.castTime < gcdTime ? skill.castTime : undefined}
                pps={pps}
                color="var(--gcd-color)"
                error={errorMap.get(p.id)}
                startTime={START_TIME}
              />
            );
          })}
        </div>

        {/* Ability track */}
        <div className="relative h-16 border-t" style={{ background: "rgba(16,185,129,0.03)", borderColor: "var(--border)" }}>
          <span className="absolute left-1.5 top-0.5 text-[9px] font-semibold tracking-wider uppercase pointer-events-none z-10"
            style={{ color: "var(--ability-color)", opacity: 0.4 }}>ABILITY</span>
          {abilityPlacements.map((p) => {
            const skill = selectedJob.skills.ability.find((s) => s.id === p.skillId);
            if (!skill) return null;
            return (
              <SkillBlock
                key={p.id}
                placement={p}
                name={skill.name}
                icon={skill.icon}
                widthSeconds={0.7}
                pps={pps}
                color="var(--ability-color)"
                error={errorMap.get(p.id)}
                startTime={START_TIME}
              />
            );
          })}
        </div>

        {/* Per-ability cooldown / effect-time rows */}
        <AbilityTimelineRows placements={placements} job={selectedJob} pps={pps} startTime={START_TIME} />

        {/* Range selection overlay */}
        {showOverlay && overlayStart !== null && overlayEnd !== null && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{
              left: (overlayStart - START_TIME) * pps,
              width: (overlayEnd - overlayStart) * pps,
              background: "rgba(250,204,21,0.12)",
              borderLeft: "2px solid rgba(250,204,21,0.6)",
              borderRight: "2px solid rgba(250,204,21,0.6)",
            }}
          />
        )}
      </div>
    </div>
  );
}
