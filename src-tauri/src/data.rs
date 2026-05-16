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

/// Save a parsed/imported BossTimelineDef as a JSON file
pub fn save_timeline_to_dir(dir: &PathBuf, timeline: &BossTimelineDef) -> Result<(), String> {
    fs::create_dir_all(dir)
        .map_err(|e| format!("Failed to create user_timelines dir: {}", e))?;
    let filename = format!("{}.json", sanitize_filename(&timeline.id));
    let path = dir.join(&filename);
    let content = serde_json::to_string_pretty(timeline)
        .map_err(|e| format!("Failed to serialize timeline: {}", e))?;
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write {}: {}", path.display(), e))?;
    Ok(())
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

/// List all saved rotation files in the save directory
pub fn list_save_files(save_dir: &PathBuf) -> Result<Vec<crate::models::SaveFileEntry>, String> {
    if !save_dir.exists() {
        return Ok(Vec::new());
    }

    let mut entries = Vec::new();
    let dir = fs::read_dir(save_dir).map_err(|e| format!("Failed to read save dir: {}", e))?;

    for entry in dir {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("json") {
            let metadata = fs::metadata(&path)
                .map_err(|e| format!("Failed to read metadata: {}", e))?;
            let modified = metadata
                .modified()
                .map(|t| {
                    let secs = t
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_secs();
                    format_timestamp(secs)
                })
                .unwrap_or_else(|_| String::from("Unknown"));

            // Read file to get name
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("Failed to read {}: {}", path.display(), e))?;
            let name = serde_json::from_str::<serde_json::Value>(&content)
                .ok()
                .and_then(|v| v["name"].as_str().map(String::from))
                .unwrap_or_else(|| {
                    path.file_stem()
                        .and_then(|s| s.to_str())
                        .unwrap_or("Unknown")
                        .to_string()
                });

            entries.push(crate::models::SaveFileEntry {
                name,
                path: path.to_string_lossy().to_string(),
                saved_at: modified,
            });
        }
    }

    entries.sort_by(|a, b| b.saved_at.cmp(&a.saved_at));
    Ok(entries)
}

fn format_timestamp(secs: u64) -> String {
    // Simple ISO-like datetime from unix seconds (no external crate needed)
    let s = secs % 60;
    let m = (secs / 60) % 60;
    let h = (secs / 3600) % 24;
    let days = secs / 86400;
    // Days since 1970-01-01 → year/month/day (simplified)
    let (y, mo, d) = days_to_ymd(days);
    format!("{:04}-{:02}-{:02} {:02}:{:02}:{:02}", y, mo, d, h, m, s)
}

fn days_to_ymd(mut days: u64) -> (u64, u64, u64) {
    let mut year = 1970u64;
    loop {
        let dy = if is_leap(year) { 366 } else { 365 };
        if days < dy { break; }
        days -= dy;
        year += 1;
    }
    let month_days: [u64; 12] = [31, if is_leap(year) { 29 } else { 28 }, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let mut month = 1u64;
    for &md in &month_days {
        if days < md { break; }
        days -= md;
        month += 1;
    }
    (year, month, days + 1)
}

fn is_leap(y: u64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
}

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .collect()
}
