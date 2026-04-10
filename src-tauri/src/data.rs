use crate::models::*;
use std::fs;
use std::path::PathBuf;

/// Load all job definitions from the data/jobs/ directory
pub fn load_jobs_from_dir(data_dir: &PathBuf) -> Result<Vec<JobDef>, String> {
    let jobs_dir = data_dir.join("jobs");
    if !jobs_dir.exists() {
        return Ok(Vec::new());
    }

    let mut jobs = Vec::new();
    let entries = fs::read_dir(&jobs_dir).map_err(|e| format!("Failed to read jobs dir: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("json") {
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("Failed to read {}: {}", path.display(), e))?;
            let job: JobDef = serde_json::from_str(&content)
                .map_err(|e| format!("Failed to parse {}: {}", path.display(), e))?;
            jobs.push(job);
        }
    }

    jobs.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(jobs)
}

/// Load all boss timeline definitions from the data/timelines/ directory
pub fn load_timelines_from_dir(data_dir: &PathBuf) -> Result<Vec<BossTimelineDef>, String> {
    let timelines_dir = data_dir.join("timelines");
    if !timelines_dir.exists() {
        return Ok(Vec::new());
    }

    let mut timelines = Vec::new();
    let entries = fs::read_dir(&timelines_dir)
        .map_err(|e| format!("Failed to read timelines dir: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("json") {
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("Failed to read {}: {}", path.display(), e))?;
            let timeline: BossTimelineDef = serde_json::from_str(&content)
                .map_err(|e| format!("Failed to parse {}: {}", path.display(), e))?;
            timelines.push(timeline);
        }
    }

    timelines.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(timelines)
}

/// Save a rotation plan to a JSON file
pub fn save_rotation_file(
    save_dir: &PathBuf,
    plan: &RotationPlan,
) -> Result<String, String> {
    fs::create_dir_all(save_dir)
        .map_err(|e| format!("Failed to create save dir: {}", e))?;

    let filename = format!("{}.json", sanitize_filename(&plan.name));
    let path = save_dir.join(&filename);

    let content = serde_json::to_string_pretty(plan)
        .map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write {}: {}", path.display(), e))?;

    Ok(path.to_string_lossy().to_string())
}

/// Load a rotation plan from a JSON file
pub fn load_rotation_file(path: &str) -> Result<RotationPlan, String> {
    let content = fs::read_to_string(path)
        .map_err(|e| format!("Failed to read {}: {}", path, e))?;
    let plan: RotationPlan = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse {}: {}", path, e))?;
    Ok(plan)
}

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .collect()
}
