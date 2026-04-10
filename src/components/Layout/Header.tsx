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
      className="flex items-center gap-5 px-5 py-2.5 border-b"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      <h1 className="text-base font-semibold tracking-wide whitespace-nowrap" style={{ color: "var(--accent)" }}>
        XIV GCD Planner
      </h1>

      <div className="w-px h-5 mx-1" style={{ background: "var(--border-strong)" }} />

      <div className="flex items-center gap-1.5">
        <label className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>ジョブ</label>
        <select
          className="rounded-md px-2.5 py-1 text-[12px] border transition-colors focus:outline-none"
          style={{ background: "var(--bg-surface)", color: "var(--text-primary)", borderColor: "var(--border-strong)" }}
          value={selectedJobId ?? ""}
          onChange={(e) => selectJob(e.target.value)}
        >
          <option value="">選択...</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>{j.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>タイムライン</label>
        <select
          className="rounded-md px-2.5 py-1 text-[12px] border transition-colors focus:outline-none"
          style={{ background: "var(--bg-surface)", color: "var(--text-primary)", borderColor: "var(--border-strong)" }}
          value={selectedTimelineId ?? ""}
          onChange={(e) => selectTimeline(e.target.value)}
        >
          <option value="">選択...</option>
          {timelines.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>SS</label>
        <input
          type="number"
          className="w-[72px] rounded-md px-2.5 py-1 text-[12px] border transition-colors focus:outline-none tabular-nums"
          style={{ background: "var(--bg-surface)", color: "var(--text-primary)", borderColor: "var(--border-strong)" }}
          value={spellSpeed}
          min={400}
          max={4000}
          onChange={(e) => setSpellSpeed(Number(e.target.value))}
        />
      </div>

      <div className="ml-auto">
        <button
          className="rounded-md px-3.5 py-1 text-[12px] font-medium transition-all cursor-pointer"
          style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid rgba(233,69,96,0.25)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent-subtle)"; e.currentTarget.style.color = "var(--accent)"; }}
          onClick={clearPlacements}
        >
          クリア
        </button>
      </div>
    </header>
  );
}
