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
    <div className="flex items-center h-full px-4 gap-6 text-sm">
      {/* Stats */}
      <div className="flex gap-4">
        <StatItem label="スキル数" value={placements.length} />
        <StatItem label="GCD" value={placements.filter((p) => p.skillType === "gcd").length} />
        <StatItem label="アビリティ" value={placements.filter((p) => p.skillType === "ability").length} />
        {stats && (
          <>
            <StatItem label="総威力" value={stats.totalPotency} />
            <StatItem label="推定DPS" value={stats.estimatedDps.toFixed(1)} />
            <StatItem label="GCD稼働率" value={`${(stats.gcdUptime * 100).toFixed(1)}%`} />
          </>
        )}
      </div>

      {/* Validation status */}
      <div className="flex items-center gap-1">
        {errorCount > 0 ? (
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.2)", color: "var(--error-color)" }}>
            ⚠ {errorCount} 件のエラー
          </span>
        ) : placements.length > 0 ? (
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.2)", color: "var(--ability-color)" }}>
            ✓ 有効
          </span>
        ) : null}
      </div>

      {/* Zoom */}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>ズーム</span>
        <input
          type="range"
          min={10}
          max={200}
          value={pps}
          onChange={(e) => setPixelsPerSecond(Number(e.target.value))}
          className="w-24 accent-[var(--accent)]"
        />
        <span className="text-xs w-8" style={{ color: "var(--text-secondary)" }}>{pps}</span>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}
