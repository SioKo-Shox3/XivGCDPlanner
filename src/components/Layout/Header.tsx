import { useAppStore } from "@/stores/timelineStore";

export function Header() {
  const jobs = useAppStore((s) => s.jobs);
  const timelines = useAppStore((s) => s.timelines);
  const selectedJobId = useAppStore((s) => s.selectedJobId);
  const selectedTimelineId = useAppStore((s) => s.selectedTimelineId);
  const spellSpeed = useAppStore((s) => s.spellSpeed);
  const selectJob = useAppStore((s) => s.selectJob);
  const selectTimeline = useAppStore((s) => s.selectTimeline);
  const setSpellSpeed = useAppStore((s) => s.setSpellSpeed);
  const clearPlacements = useAppStore((s) => s.clearPlacements);

  return (
    <header
      className="flex items-center gap-4 px-4 py-2 border-b border-white/10"
      style={{ background: "var(--bg-secondary)" }}
    >
      <h1 className="text-lg font-bold whitespace-nowrap" style={{ color: "var(--accent)" }}>
        XIV GCD Planner
      </h1>

      <div className="flex items-center gap-2 ml-4">
        <label className="text-xs" style={{ color: "var(--text-secondary)" }}>ジョブ</label>
        <select
          className="rounded px-2 py-1 text-sm border border-white/20 focus:outline-none focus:border-blue-400"
          style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}
          value={selectedJobId ?? ""}
          onChange={(e) => selectJob(e.target.value)}
        >
          <option value="">選択...</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>{j.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs" style={{ color: "var(--text-secondary)" }}>タイムライン</label>
        <select
          className="rounded px-2 py-1 text-sm border border-white/20 focus:outline-none focus:border-blue-400"
          style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}
          value={selectedTimelineId ?? ""}
          onChange={(e) => selectTimeline(e.target.value)}
        >
          <option value="">選択...</option>
          {timelines.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs" style={{ color: "var(--text-secondary)" }}>SS</label>
        <input
          type="number"
          className="w-20 rounded px-2 py-1 text-sm border border-white/20 focus:outline-none focus:border-blue-400"
          style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}
          value={spellSpeed}
          min={400}
          max={4000}
          onChange={(e) => setSpellSpeed(Number(e.target.value))}
        />
      </div>

      <div className="ml-auto">
        <button
          className="rounded px-3 py-1 text-sm font-medium transition-colors cursor-pointer"
          style={{ background: "var(--accent)", color: "#fff" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
          onClick={clearPlacements}
        >
          クリア
        </button>
      </div>
    </header>
  );
}
