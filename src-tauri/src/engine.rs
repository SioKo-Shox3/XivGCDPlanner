use crate::models::*;
use std::collections::HashMap;

/// Calculate the actual GCD time based on spell speed
pub fn calculate_gcd_time(base_gcd: f64, spell_speed: u32) -> f64 {
    let base = 400_f64;
    let ss = spell_speed as f64;
    let modifier = ((2000.0 - ((130.0 * (ss - base)) / 1900.0 + 1000.0).floor()) * base_gcd * 100.0 / 100.0).floor() / 1000.0;
    modifier.max(1.5)
}

/// Validate a rotation against GCD and ability recast constraints
pub fn validate_rotation(
    job: &JobDef,
    placements: &[SkillPlacement],
    spell_speed: u32,
) -> ValidationResult {
    let mut errors = Vec::new();
    let gcd_time = calculate_gcd_time(2.5, spell_speed);

    // Build lookup maps
    let gcd_map: HashMap<u32, &GcdSkillDef> = job.skills.gcd.iter().map(|s| (s.id, s)).collect();
    let ability_map: HashMap<u32, &AbilitySkillDef> = job.skills.ability.iter().map(|s| (s.id, s)).collect();

    // Sort placements by time
    let mut sorted: Vec<&SkillPlacement> = placements.iter().collect();
    sorted.sort_by(|a, b| a.time.partial_cmp(&b.time).unwrap_or(std::cmp::Ordering::Equal));

    // Track last GCD end time
    let mut last_gcd_end: f64 = -999.0;

    // Track per-ability last usage times (for multi-charge support, track Vec of usage times)
    let mut ability_usage: HashMap<u32, Vec<f64>> = HashMap::new();

    for p in &sorted {
        match p.skill_type.as_str() {
            "gcd" => {
                if let Some(skill) = gcd_map.get(&p.skill_id) {
                    // Check GCD constraint
                    if p.time < last_gcd_end - 0.01 {
                        errors.push(ValidationError {
                            placement_id: p.id.clone(),
                            message: format!(
                                "GCDクールダウン中です (次に使用可能: {:.2}s)",
                                last_gcd_end
                            ),
                        });
                    }
                    // Calculate actual GCD for this skill
                    let actual_gcd = if skill.cast_time > gcd_time {
                        skill.cast_time // Cast time longer than GCD (e.g. Fire IV)
                    } else {
                        gcd_time
                    };
                    last_gcd_end = p.time + actual_gcd;
                } else {
                    errors.push(ValidationError {
                        placement_id: p.id.clone(),
                        message: format!("不明なGCDスキル ID: {}", p.skill_id),
                    });
                }
            }
            "ability" => {
                if let Some(skill) = ability_map.get(&p.skill_id) {
                    let usages = ability_usage.entry(p.skill_id).or_default();

                    // Remove usages whose charges have recovered by now
                    let recast = skill.recast_time;
                    let max_charges = skill.max_charges as usize;

                    // Count how many charges are available at time p.time
                    let mut available_charges = max_charges;
                    for &usage_time in usages.iter() {
                        let recovered_charges =
                            ((p.time - usage_time) / recast).floor() as usize;
                        if recovered_charges < 1 {
                            available_charges = available_charges.saturating_sub(1);
                        }
                    }

                    if available_charges == 0 {
                        // Find earliest recovery time
                        let earliest_recovery = usages
                            .iter()
                            .map(|&t| t + recast)
                            .fold(f64::INFINITY, f64::min);
                        errors.push(ValidationError {
                            placement_id: p.id.clone(),
                            message: format!(
                                "リキャスト中です (次に使用可能: {:.2}s)",
                                earliest_recovery
                            ),
                        });
                    }

                    usages.push(p.time);
                } else {
                    errors.push(ValidationError {
                        placement_id: p.id.clone(),
                        message: format!("不明なアビリティ ID: {}", p.skill_id),
                    });
                }
            }
            _ => {
                errors.push(ValidationError {
                    placement_id: p.id.clone(),
                    message: format!("不明なスキルタイプ: {}", p.skill_type),
                });
            }
        }
    }

    ValidationResult {
        valid: errors.is_empty(),
        errors,
    }
}

/// Calculate rotation statistics
pub fn calculate_stats(
    job: &JobDef,
    placements: &[SkillPlacement],
    spell_speed: u32,
    duration: f64,
) -> RotationStats {
    let gcd_time = calculate_gcd_time(2.5, spell_speed);
    let gcd_map: HashMap<u32, &GcdSkillDef> = job.skills.gcd.iter().map(|s| (s.id, s)).collect();

    let mut total_potency: u32 = 0;
    let mut gcd_count: u32 = 0;
    let mut ability_count: u32 = 0;
    let mut total_gcd_time: f64 = 0.0;

    for p in placements {
        match p.skill_type.as_str() {
            "gcd" => {
                if let Some(skill) = gcd_map.get(&p.skill_id) {
                    total_potency += skill.potency;
                    gcd_count += 1;
                    let actual = if skill.cast_time > gcd_time {
                        skill.cast_time
                    } else {
                        gcd_time
                    };
                    total_gcd_time += actual;
                }
            }
            "ability" => {
                ability_count += 1;
                // Abilities generally don't have potency in this model, but we could add it
            }
            _ => {}
        }
    }

    let estimated_dps = if duration > 0.0 {
        total_potency as f64 / duration
    } else {
        0.0
    };
    let gcd_uptime = if duration > 0.0 {
        (total_gcd_time / duration).min(1.0)
    } else {
        0.0
    };

    RotationStats {
        total_potency,
        estimated_dps,
        gcd_count,
        ability_count,
        gcd_uptime,
    }
}
