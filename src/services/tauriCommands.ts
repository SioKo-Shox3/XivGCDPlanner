import { invoke } from "@tauri-apps/api/core";
import type {
  JobDef,
  BossTimelineDef,
  SkillPlacement,
  ValidationResult,
  RotationStats,
} from "@/types";

export async function loadJobs(): Promise<JobDef[]> {
  return invoke<JobDef[]>("load_jobs");
}

export async function loadTimelines(): Promise<BossTimelineDef[]> {
  return invoke<BossTimelineDef[]>("load_timelines");
}

export async function validateRotation(
  jobId: string,
  placements: SkillPlacement[],
  spellSpeed: number
): Promise<ValidationResult> {
  return invoke<ValidationResult>("validate_rotation", {
    jobId,
    placements,
    spellSpeed,
  });
}

export async function calculateStats(
  jobId: string,
  placements: SkillPlacement[],
  spellSpeed: number,
  duration: number
): Promise<RotationStats> {
  return invoke<RotationStats>("calculate_stats", {
    jobId,
    placements,
    spellSpeed,
    duration,
  });
}

export async function saveRotation(
  name: string,
  jobId: string,
  timelineId: string,
  spellSpeed: number,
  placements: SkillPlacement[]
): Promise<string> {
  return invoke<string>("save_rotation", {
    name,
    jobId,
    timelineId,
    spellSpeed,
    placements,
  });
}

export async function loadRotation(path: string): Promise<{
  name: string;
  jobId: string;
  timelineId: string;
  spellSpeed: number;
  placements: SkillPlacement[];
}> {
  return invoke("load_rotation", { path });
}

export function calculateGcdTime(baseGcd: number, spellSpeed: number): number {
  // FF14 GCD formula approximation (client-side for instant feedback)
  const base = 400;
  const modifier = Math.floor(
    ((2000 - Math.floor((130 * (spellSpeed - base)) / 1900 + 1000)) * baseGcd * 100) / 100
  ) / 1000;
  return Math.max(modifier, 1.5);
}
