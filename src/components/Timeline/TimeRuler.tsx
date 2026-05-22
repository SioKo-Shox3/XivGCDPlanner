interface Props {
  duration: number;
  pps: number;
  startTime: number;
}

export function TimeRuler({ duration, pps, startTime }: Props) {
  const marks: { time: number; major: boolean }[] = [];
  // Start from the nearest multiple of 5 at or after startTime
  const firstTick = Math.ceil(startTime / 5) * 5;
  for (let t = firstTick; t <= duration; t += 5) {
    marks.push({ time: t, major: t % 10 === 0 || t === 0 });
  }

  return (
    <div className="relative h-7 border-b" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
      {marks.map(({ time, major }) => (
        <div
          key={time}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: (time - startTime) * pps }}
        >
          <div
            className="border-l"
            style={{
              height: major ? 18 : 9,
              borderColor: time === 0
                ? "rgba(239,68,68,0.8)"
                : major ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
              marginTop: major ? 0 : 9,
            }}
          />
          {major && (
            <span
              className="absolute top-1 text-[10px] font-medium tabular-nums ml-1.5"
              style={{ color: time === 0 ? "rgba(239,68,68,0.9)" : "var(--text-muted)" }}
            >
              {time === 0 ? "PULL" : formatTime(time)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function formatTime(seconds: number): string {
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const base = `${m}:${s.toString().padStart(2, "0")}`;
  return seconds < 0 ? `-${base}` : base;
}
