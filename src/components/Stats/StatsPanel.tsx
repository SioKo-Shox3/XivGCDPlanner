import { useEffect } from "react";
import { useAppStore } from "@/stores/timelineStore";
import { validateRotation, calculateStats } from "@/services/tauriCommands";

export function StatsPanel() {
  const selectedJob = useAppStore((s) => s.selectedJob)();
  const selectedTimeline = useAppStore((s) => s.selectedTimeline)();
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
    <div className="flex items-center h-full px-5 gap-6">
      {/* Stats */}
      <div className="flex gap-5">
        <StatItem label="スキル数" value={placements.length} />
        <StatItem label="GCD" value={placements.filter((p) => p.skillType === "gcd").length} accent="var(--gcd-color)" />
        <StatItem label="アビリティ" value={placements.filter((p) => p.skillType === "ability").length} accent="var(--ability-color)" />
        {stats && (
          <>
            <div className="w-px self-stretch my-2" style={{ background: "var(--border)" }} />
            <StatItem label="総威力" value={stats.totalPotency} />
            <StatItem label="推定DPS" value={stats.estimatedDps.toFixed(1)} accent="var(--accent)" />
            <StatItem label="GCD稼働率" value={`${(stats.gcdUptime * 100).toFixed(1)}%`} />
          </>
        )}
      </div>

      {/* Validation status */}
      <div className="flex items-center gap-1">
        {errorCount > 0 ? (
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-md" style={{ background: "rgba(239,68,68,0.12)", color: "var(--error-color)", border: "1px solid rgba(239,68,68,0.2)" }}>
            ⚠ {errorCount} 件のエラー
          </span>
        ) : placements.length > 0 ? (
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-md" style={{ background: "rgba(16,185,129,0.1)", color: "var(--ability-color)", border: "1px solid rgba(16,185,129,0.2)" }}>
            ✓ 有効
          </span>
        ) : null}
      </div>

      {/* Zoom */}
      <div className="ml-auto flex items-center gap-2.5">
        <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>ズーム</span>
        <input
          type="range"
          min={10}
          max={200}
          value={pps}
          onChange={(e) => setPixelsPerSecond(Number(e.target.value))}
          className="w-28"
        />
        <span className="text-[11px] tabular-nums w-8" style={{ color: "var(--text-secondary)" }}>{pps}</span>
      </div>
    </div>
  );
}

function StatItem({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] font-medium tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-[13px] font-semibold tabular-nums" style={{ color: accent ?? "var(--text-primary)" }}>{value}</span>
    </div>
  );
}
