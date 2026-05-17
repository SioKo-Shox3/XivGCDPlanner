import { useEffect, useCallback } from "react";
import { useAppStore } from "@/stores/timelineStore";
import { validateRotation, calculateStats, calculateRangeStats } from "@/services/tauriCommands";

export function StatsPanel() {
  const selectedJob = useAppStore((s) => s.jobs.find((j) => j.id === s.selectedJobId));
  const selectedTimeline = useAppStore((s) => s.timelines.find((t) => t.id === s.selectedTimelineId));
  const placements = useAppStore((s) => s.placements);
  const spellSpeed = useAppStore((s) => s.spellSpeed);
  const stats = useAppStore((s) => s.stats);
  const rangeStart = useAppStore((s) => s.rangeStart);
  const rangeEnd = useAppStore((s) => s.rangeEnd);
  const rangeStats = useAppStore((s) => s.rangeStats);
  const validationResult = useAppStore((s) => s.validationResult);
  const setValidationResult = useAppStore((s) => s.setValidationResult);
  const setStats = useAppStore((s) => s.setStats);
  const setRange = useAppStore((s) => s.setRange);
  const clearRange = useAppStore((s) => s.clearRange);
  const setRangeStats = useAppStore((s) => s.setRangeStats);
  const pps = useAppStore((s) => s.view.pixelsPerSecond);
  const setPixelsPerSecond = useAppStore((s) => s.setPixelsPerSecond);

  // Recompute global stats when placements/job/timeline change
  useEffect(() => {
    if (!selectedJob || placements.length === 0) {
      setValidationResult(null);
      setStats(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const [vr, st] = await Promise.all([
          validateRotation(selectedJob.id, placements, spellSpeed),
          selectedTimeline
            ? calculateStats(selectedJob.id, placements, spellSpeed, selectedTimeline.duration)
            : Promise.resolve(null),
        ]);
        setValidationResult(vr);
        if (st) setStats(st);
      } catch (e) {
        console.error("Validation error:", e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedJob, selectedTimeline, placements, spellSpeed, setValidationResult, setStats]);

  // Recompute range stats when range or placements change
  useEffect(() => {
    if (!selectedJob || rangeStart === null || rangeEnd === null || rangeEnd <= rangeStart) {
      setRangeStats(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const rs = await calculateRangeStats(
          selectedJob.id,
          placements,
          spellSpeed,
          rangeStart,
          rangeEnd
        );
        setRangeStats(rs);
      } catch (e) {
        console.error("Range stats error:", e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedJob, placements, spellSpeed, rangeStart, rangeEnd, setRangeStats]);

  const handleRangeStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      if (!isNaN(val) && rangeEnd !== null) {
        setRange(val, rangeEnd);
      } else if (!isNaN(val)) {
        useAppStore.getState().setRangeStart(val);
      }
    },
    [rangeEnd, setRange]
  );

  const handleRangeEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      if (!isNaN(val) && rangeStart !== null) {
        setRange(rangeStart, val);
      } else if (!isNaN(val)) {
        useAppStore.getState().setRangeEnd(val);
      }
    },
    [rangeStart, setRange]
  );

  const errorCount = validationResult?.errors.length ?? 0;
  const maxTime = selectedTimeline?.duration ?? 600;

  return (
    <div className="flex items-center h-full px-5 gap-5 overflow-x-auto">
      {/* Global stats */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <StatItem label="スキル" value={placements.length} />
        <StatItem label="GCD" value={placements.filter((p) => p.skillType === "gcd").length} accent="var(--gcd-color)" />
        <StatItem label="アビリティ" value={placements.filter((p) => p.skillType === "ability").length} accent="var(--ability-color)" />
        {stats && (
          <>
            <div className="w-px self-stretch my-2" style={{ background: "var(--border-strong)" }} />
            <StatItem label="総威力" value={stats.totalPotency} />
            <StatItem label="DPS" value={stats.estimatedDps.toFixed(1)} accent="var(--accent)" />
            <StatItem label="稼働率" value={`${(stats.gcdUptime * 100).toFixed(1)}%`} />
          </>
        )}
      </div>

      {/* Validation status */}
      <div className="flex items-center flex-shrink-0">
        {errorCount > 0 ? (
          <span className="badge badge-error">⚠ {errorCount} 件のエラー</span>
        ) : placements.length > 0 ? (
          <span className="badge badge-success">✓ 有効</span>
        ) : null}
      </div>

      {/* Range selector */}
      {selectedJob && (
        <>
          <div className="w-px self-stretch my-2 flex-shrink-0" style={{ background: "var(--border-strong)" }} />
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>区間</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={maxTime}
                step={0.5}
                value={rangeStart ?? ""}
                placeholder="開始(s)"
                onChange={handleRangeStartChange}
                className="w-20 text-[11px] px-1.5 py-0.5 rounded text-center tabular-nums"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-primary)",
                }}
              />
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>〜</span>
              <input
                type="number"
                min={0}
                max={maxTime}
                step={0.5}
                value={rangeEnd ?? ""}
                placeholder="終了(s)"
                onChange={handleRangeEndChange}
                className="w-20 text-[11px] px-1.5 py-0.5 rounded text-center tabular-nums"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-primary)",
                }}
              />
              {(rangeStart !== null || rangeEnd !== null) && (
                <button
                  onClick={clearRange}
                  className="text-[11px] leading-none px-1"
                  style={{ color: "var(--text-muted)" }}
                  title="区間をクリア"
                >
                  ×
                </button>
              )}
            </div>
            {rangeStats && rangeStart !== null && rangeEnd !== null && rangeEnd > rangeStart && (
              <>
                <div className="w-px self-stretch my-2" style={{ background: "var(--border)" }} />
                <StatItem label="区間威力" value={rangeStats.totalPotency} accent="var(--accent)" />
                <StatItem label="区間DPS" value={rangeStats.dps.toFixed(1)} accent="var(--accent)" />
                <StatItem label="区間スキル数" value={rangeStats.skillCount} />
              </>
            )}
          </div>
        </>
      )}

      {/* Zoom */}
      <div className="ml-auto flex items-center gap-2.5 flex-shrink-0">
        <span className="ctrl-label">ズーム</span>
        <input
          type="range"
          min={10}
          max={200}
          value={pps}
          onChange={(e) => setPixelsPerSecond(Number(e.target.value))}
          className="w-24"
        />
        <span className="text-[11px] tabular-nums w-7 text-right" style={{ color: "var(--text-secondary)" }}>{pps}</span>
      </div>
    </div>
  );
}

function StatItem({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-[14px] font-semibold tabular-nums leading-tight" style={{ color: accent ?? "var(--text-primary)" }}>{value}</span>
    </div>
  );
}
