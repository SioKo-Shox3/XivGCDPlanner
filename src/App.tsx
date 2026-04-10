import { useEffect } from "react";
import { useAppStore } from "@/stores/timelineStore";
import { loadJobs, loadTimelines } from "@/services/tauriCommands";
import { AppLayout } from "@/components/Layout/AppLayout";

export default function App() {
  const setJobs = useAppStore((s) => s.setJobs);
  const setTimelines = useAppStore((s) => s.setTimelines);

  useEffect(() => {
    (async () => {
      try {
        const [jobs, timelines] = await Promise.all([loadJobs(), loadTimelines()]);
        setJobs(jobs);
        setTimelines(timelines);
      } catch (e) {
        console.error("Failed to load data:", e);
      }
    })();
  }, [setJobs, setTimelines]);

  return <AppLayout />;
}
