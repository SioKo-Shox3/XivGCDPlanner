interface Props {
  duration: number;
  pps: number;
}

export function TimeRuler({ duration, pps }: Props) {
  const marks: { time: number; major: boolean }[] = [];
  for (let t = 0; t <= duration; t += 5) {
    marks.push({ time: t, major: t % 10 === 0 });
  }

  return (
    <div className="relative h-7 border-b" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
      {marks.map(({ time, major }) => (
        <div
          key={time}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: time * pps }}
        >
          <div
            className="border-l"
            style={{
              height: major ? 18 : 9,
              borderColor: major ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
              marginTop: major ? 0 : 9,
            }}
          />
          {major && (
            <span className="absolute top-1 text-[10px] font-medium tabular-nums ml-1.5" style={{ color: "var(--text-muted)" }}>
              {formatTime(time)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
