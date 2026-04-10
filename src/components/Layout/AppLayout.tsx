import { Header } from "./Header";
import { SkillPalette } from "@/components/SkillPalette/SkillPalette";
import { TimelineCanvas } from "@/components/Timeline/TimelineCanvas";
import { StatsPanel } from "@/components/Stats/StatsPanel";

export function AppLayout() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 flex-shrink-0 border-r border-white/10 overflow-y-auto"
          style={{ background: "var(--bg-secondary)" }}>
          <SkillPalette />
        </aside>
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <TimelineCanvas />
          </div>
          <div className="h-28 flex-shrink-0 border-t border-white/10"
            style={{ background: "var(--bg-secondary)" }}>
            <StatsPanel />
          </div>
        </main>
      </div>
    </div>
  );
}
