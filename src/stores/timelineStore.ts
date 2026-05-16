import { create } from "zustand";
import type {
  JobDef,
  BossTimelineDef,
  SkillPlacement,
  ValidationResult,
  RotationStats,
  TimelineViewState,
} from "@/types";
import { calculateGcdTime } from "@/services/tauriCommands";

interface AppState {
  // Data
  jobs: JobDef[];
  timelines: BossTimelineDef[];

  // Selections
  selectedJobId: string | null;
  selectedTimelineId: string | null;
  spellSpeed: number;

  // Rotation state
  placements: SkillPlacement[];
  validationResult: ValidationResult | null;
  stats: RotationStats | null;

  // View state
  view: TimelineViewState;

  // Drag state
  draggingSkillId: number | null;
  draggingSkillType: "gcd" | "ability" | null;

  // Actions - data loading
  setJobs: (jobs: JobDef[]) => void;
  setTimelines: (timelines: BossTimelineDef[]) => void;

  // Actions - selections
  selectJob: (jobId: string) => void;
  selectTimeline: (timelineId: string) => void;
  setSpellSpeed: (ss: number) => void;

  // Actions - rotation editing
  addPlacement: (p: SkillPlacement) => void;
  appendSkill: (skillId: number, skillType: "gcd" | "ability") => void;
  removePlacement: (id: string) => void;
  movePlacement: (id: string, newTime: number) => void;
  clearPlacements: () => void;

  // Actions - validation
  setValidationResult: (r: ValidationResult | null) => void;
  setStats: (s: RotationStats | null) => void;

  // Actions - view
  setPixelsPerSecond: (pps: number) => void;
  setScrollLeft: (sl: number) => void;
  selectPlacement: (id: string | null) => void;

  // Actions - drag
  startDrag: (skillId: number, skillType: "gcd" | "ability") => void;
  endDrag: () => void;

  // Computed helpers
  selectedJob: () => JobDef | undefined;
  selectedTimeline: () => BossTimelineDef | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  jobs: [],
  timelines: [],
  selectedJobId: null,
  selectedTimelineId: null,
  spellSpeed: 400,
  placements: [],
  validationResult: null,
  stats: null,
  view: {
    pixelsPerSecond: 40,
    scrollLeft: 0,
    selectedPlacementId: null,
  },
  draggingSkillId: null,
  draggingSkillType: null,

  setJobs: (jobs) => set({ jobs }),
  setTimelines: (timelines) => set({ timelines }),

  selectJob: (jobId) =>
    set({ selectedJobId: jobId, placements: [], validationResult: null, stats: null }),
  selectTimeline: (timelineId) =>
    set({ selectedTimelineId: timelineId, placements: [], validationResult: null, stats: null }),
  setSpellSpeed: (ss) => set({ spellSpeed: ss }),

  addPlacement: (p) =>
    set((s) => ({ placements: [...s.placements, p].sort((a, b) => a.time - b.time) })),
  appendSkill: (skillId, skillType) => {
    const s = get();
    if (!s.selectedJobId || !s.selectedTimelineId) return;
    const gcdTime = calculateGcdTime(2.5, s.spellSpeed);
    let time = 0;
    if (skillType === "gcd") {
      const lastGcd = [...s.placements].filter((p) => p.skillType === "gcd").pop();
      time = lastGcd ? Math.round((lastGcd.time + gcdTime) * 100) / 100 : 0;
    } else {
      // Place ability after the last placement (GCD or ability)
      const last = s.placements[s.placements.length - 1];
      time = last ? Math.round((last.time + 0.7) * 100) / 100 : 0;
    }
    set({
      placements: [...s.placements, { id: crypto.randomUUID(), skillId, skillType, time }].sort(
        (a, b) => a.time - b.time
      ),
      validationResult: null,
    });
  },
  removePlacement: (id) =>
    set((s) => ({
      placements: s.placements.filter((p) => p.id !== id),
      validationResult: null,
    })),
  movePlacement: (id, newTime) =>
    set((s) => {
      const target = s.placements.find((p) => p.id === id);
      if (!target) return s;

      // Apply the move
      let updated = s.placements.map((p) => (p.id === id ? { ...p, time: newTime } : p));

      // GCD repulsion: push overlapping GCDs apart
      if (target.skillType === "gcd") {
        const gcdTime = calculateGcdTime(2.5, s.spellSpeed);
        const gcds = updated.filter((p) => p.skillType === "gcd").sort((a, b) => a.time - b.time);
        const nonGcds = updated.filter((p) => p.skillType !== "gcd");

        const movedIdx = gcds.findIndex((p) => p.id === id);
        // Push right: ensure each subsequent GCD doesn't overlap
        for (let i = movedIdx + 1; i < gcds.length; i++) {
          const minTime = Math.round((gcds[i - 1].time + gcdTime) * 100) / 100;
          if (gcds[i].time < minTime) {
            gcds[i] = { ...gcds[i], time: minTime };
          } else break;
        }
        // Push left: ensure each preceding GCD doesn't overlap
        for (let i = movedIdx - 1; i >= 0; i--) {
          const maxTime = Math.round((gcds[i + 1].time - gcdTime) * 100) / 100;
          if (gcds[i].time > maxTime) {
            gcds[i] = { ...gcds[i], time: Math.max(0, maxTime) };
          } else break;
        }

        // If left GCDs hit 0 boundary, clamp moved GCD so it doesn't overlap
        if (movedIdx > 0) {
          const leftEnd = Math.round((gcds[movedIdx - 1].time + gcdTime) * 100) / 100;
          if (gcds[movedIdx].time < leftEnd) {
            gcds[movedIdx] = { ...gcds[movedIdx], time: leftEnd };
            // Re-push right from corrected position
            for (let i = movedIdx + 1; i < gcds.length; i++) {
              const minTime = Math.round((gcds[i - 1].time + gcdTime) * 100) / 100;
              if (gcds[i].time < minTime) {
                gcds[i] = { ...gcds[i], time: minTime };
              } else break;
            }
          }
        }

        updated = [...gcds, ...nonGcds];
      }

      return {
        placements: updated.sort((a, b) => a.time - b.time),
        validationResult: null,
      };
    }),
  clearPlacements: () => set({ placements: [], validationResult: null, stats: null }),

  setValidationResult: (r) => set({ validationResult: r }),
  setStats: (s) => set({ stats: s }),

  setPixelsPerSecond: (pps) =>
    set((s) => ({ view: { ...s.view, pixelsPerSecond: Math.max(10, Math.min(200, pps)) } })),
  setScrollLeft: (sl) => set((s) => ({ view: { ...s.view, scrollLeft: sl } })),
  selectPlacement: (id) =>
    set((s) => ({ view: { ...s.view, selectedPlacementId: id } })),

  startDrag: (skillId, skillType) => set({ draggingSkillId: skillId, draggingSkillType: skillType }),
  endDrag: () => set({ draggingSkillId: null, draggingSkillType: null }),

  selectedJob: () => {
    const s = get();
    return s.jobs.find((j) => j.id === s.selectedJobId);
  },
  selectedTimeline: () => {
    const s = get();
    return s.timelines.find((t) => t.id === s.selectedTimelineId);
  },
}));
