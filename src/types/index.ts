// ===== Job & Skill Types =====

export type SkillType = "gcd" | "ability";
export type Role = "tank" | "healer" | "melee" | "ranged" | "caster";

export interface GcdSkillDef {
  id: number;
  name: string;
  castTime: number;
  potency: number;
  icon: string;
  description: string;
}

export interface AbilitySkillDef {
  id: number;
  name: string;
  recastTime: number;
  maxCharges: number;
  icon: string;
  description: string;
}

export interface JobDef {
  id: string;
  name: string;
  role: Role;
  icon: string;
  skills: {
    gcd: GcdSkillDef[];
    ability: AbilitySkillDef[];
  };
}

// ===== Boss Timeline Types =====

export type BossEventType = "raidwide" | "tankbuster" | "mechanic" | "enrage" | "downtime";

export interface BossEvent {
  time: number;
  name: string;
  type: BossEventType;
  castTime?: number;
  description?: string;
}

export interface BossTimelineDef {
  id: string;
  name: string;
  duration: number;
  events: BossEvent[];
}

// ===== Player Rotation Types =====

export interface SkillPlacement {
  id: string;
  skillId: number;
  skillType: SkillType;
  time: number;
}

export interface ValidationError {
  placementId: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface RotationStats {
  totalPotency: number;
  estimatedDps: number;
  gcdCount: number;
  abilityCount: number;
  gcdUptime: number;
}

export interface RotationPlan {
  id: string;
  name: string;
  jobId: string;
  timelineId: string;
  spellSpeed: number;
  placements: SkillPlacement[];
}

// ===== UI State Types =====

export interface TimelineViewState {
  pixelsPerSecond: number;
  scrollLeft: number;
  selectedPlacementId: string | null;
}
