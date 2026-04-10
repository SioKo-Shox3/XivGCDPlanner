import { create } from "zustand";
import type {
  JobDef,
  BossTimelineDef,
  SkillPlacement,
  ValidationResult,
  RotationStats,
  TimelineViewState,
} from "@/types";

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
  removePlacement: (id) =>
    set((s) => ({
      placements: s.placements.filter((p) => p.id !== id),
      validationResult: null,
    })),
  movePlacement: (id, newTime) =>
    set((s) => ({
      placements: s.placements
        .map((p) => (p.id === id ? { ...p, time: newTime } : p))
        .sort((a, b) => a.time - b.time),
      validationResult: null,
    })),
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
