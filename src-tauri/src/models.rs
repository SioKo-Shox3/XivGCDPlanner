use serde::{Deserialize, Serialize};

// ===== Job & Skill Definitions =====

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GcdSkillDef {
    pub id: u32,
    pub name: String,
    #[serde(rename = "castTime")]
    pub cast_time: f64,
    pub potency: u32,
    pub icon: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AbilitySkillDef {
    pub id: u32,
    pub name: String,
    #[serde(rename = "recastTime")]
    pub recast_time: f64,
    #[serde(rename = "maxCharges")]
    pub max_charges: u32,
    pub icon: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobSkills {
    pub gcd: Vec<GcdSkillDef>,
    pub ability: Vec<AbilitySkillDef>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobDef {
    pub id: String,
    pub name: String,
    pub role: String,
    pub icon: String,
    pub skills: JobSkills,
}

// ===== Boss Timeline =====

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BossEvent {
    pub time: f64,
    pub name: String,
    #[serde(rename = "type")]
    pub event_type: String,
    #[serde(rename = "castTime")]
    pub cast_time: Option<f64>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BossTimelineDef {
    pub id: String,
    pub name: String,
    pub duration: f64,
    pub events: Vec<BossEvent>,
}

// ===== Player Rotation =====

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillPlacement {
    pub id: String,
    #[serde(rename = "skillId")]
    pub skill_id: u32,
    #[serde(rename = "skillType")]
    pub skill_type: String, // "gcd" | "ability"
    pub time: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationError {
    #[serde(rename = "placementId")]
    pub placement_id: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<ValidationError>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RotationStats {
    #[serde(rename = "totalPotency")]
    pub total_potency: u32,
    #[serde(rename = "estimatedDps")]
    pub estimated_dps: f64,
    #[serde(rename = "gcdCount")]
    pub gcd_count: u32,
    #[serde(rename = "abilityCount")]
    pub ability_count: u32,
    #[serde(rename = "gcdUptime")]
    pub gcd_uptime: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RotationPlan {
    pub name: String,
    #[serde(rename = "jobId")]
    pub job_id: String,
    #[serde(rename = "timelineId")]
    pub timeline_id: String,
    #[serde(rename = "spellSpeed")]
    pub spell_speed: u32,
    pub placements: Vec<SkillPlacement>,
}
