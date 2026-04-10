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
    <div className="relative h-6 border-b border-white/10" style={{ background: "var(--bg-secondary)" }}>
      {marks.map(({ time, major }) => (
        <div
          key={time}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: time * pps }}
        >
          <div
            className="border-l"
            style={{
              height: major ? 16 : 8,
              borderColor: major ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
              marginTop: major ? 0 : 8,
            }}
          />
          {major && (
            <span className="absolute top-0 text-[10px] ml-1" style={{ color: "var(--text-secondary)" }}>
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
