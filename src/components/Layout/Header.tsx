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
      className="flex items-center gap-4 px-4 h-12 flex-shrink-0 border-b"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mr-1">
        <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black"
          style={{ background: "var(--accent)", color: "#fff" }}>
          XIV
        </div>
        <span className="text-[13px] font-semibold tracking-wide whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
          GCD Planner
        </span>
      </div>

      <div className="w-px h-5" style={{ background: "var(--border-strong)" }} />

      {/* Job selector */}
      <div className="flex items-center gap-2">
        <span className="ctrl-label">ジョブ</span>
        <select
          className="ctrl"
          value={selectedJobId ?? ""}
          onChange={(e) => selectJob(e.target.value)}
        >
          <option value="">選択...</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>{j.name}</option>
          ))}
        </select>
      </div>

      {/* Timeline selector */}
      <div className="flex items-center gap-2">
        <span className="ctrl-label">タイムライン</span>
        <select
          className="ctrl"
          value={selectedTimelineId ?? ""}
          onChange={(e) => selectTimeline(e.target.value)}
        >
          <option value="">選択...</option>
          {timelines.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Spell Speed */}
      <div className="flex items-center gap-2">
        <span className="ctrl-label">SS</span>
        <input
          type="number"
          className="ctrl"
          style={{ width: 68 }}
          value={spellSpeed}
          min={400}
          max={4000}
          onChange={(e) => setSpellSpeed(Number(e.target.value))}
        />
      </div>

      {/* Spacer + Action */}
      <div className="ml-auto flex items-center gap-2">
        <button className="btn btn-danger" onClick={clearPlacements}>
          クリア
        </button>
      </div>
    </header>
  );
}
