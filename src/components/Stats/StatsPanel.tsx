import { useEffect } from "react";
import { useAppStore } from "@/stores/timelineStore";
import { validateRotation, calculateStats } from "@/services/tauriCommands";

export function StatsPanel() {
  const selectedJob = useAppStore((s) => s.jobs.find((j) => j.id === s.selectedJobId));
  const selectedTimeline = useAppStore((s) => s.timelines.find((t) => t.id === s.selectedTimelineId));
  const placements = useAppStore((s) => s.placements);
  const spellSpeed = useAppStore((s) => s.spellSpeed);
  const stats = useAppStore((s) => s.stats);
  const validationResult = useAppStore((s) => s.validationResult);
  const setValidationResult = useAppStore((s) => s.setValidationResult);
  const setStats = useAppStore((s) => s.setStats);
  const pps = useAppStore((s) => s.view.pixelsPerSecond);
  const setPixelsPerSecond = useAppStore((s) => s.setPixelsPerSecond);

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

  const errorCount = validationResult?.errors.length ?? 0;

  return (
    <div className="flex items-center h-full px-5 gap-5">
      {/* Stats */}
      <div className="flex items-center gap-4">
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
      <div className="flex items-center">
        {errorCount > 0 ? (
          <span className="badge badge-error">
            ⚠ {errorCount} 件のエラー
          </span>
        ) : placements.length > 0 ? (
          <span className="badge badge-success">
            ✓ 有効
          </span>
        ) : null}
      </div>

      {/* Zoom */}
      <div className="ml-auto flex items-center gap-2.5">
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
