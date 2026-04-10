mod data;
mod engine;
mod models;

use models::*;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Manager, State};

struct AppData {
    data_dir: PathBuf,
    save_dir: PathBuf,
    jobs: Vec<JobDef>,
    timelines: Vec<BossTimelineDef>,
}

struct AppState(Mutex<AppData>);

#[tauri::command]
fn load_jobs(state: State<AppState>) -> Result<Vec<JobDef>, String> {
    let mut data = state.0.lock().map_err(|e| e.to_string())?;
    let jobs = data::load_jobs_from_dir(&data.data_dir)?;
    data.jobs = jobs.clone();
    Ok(jobs)
}

#[tauri::command]
fn load_timelines(state: State<AppState>) -> Result<Vec<BossTimelineDef>, String> {
    let mut data = state.0.lock().map_err(|e| e.to_string())?;
    let timelines = data::load_timelines_from_dir(&data.data_dir)?;
    data.timelines = timelines.clone();
    Ok(timelines)
}

#[tauri::command]
fn validate_rotation(
    state: State<AppState>,
    job_id: String,
    placements: Vec<SkillPlacement>,
    spell_speed: u32,
) -> Result<ValidationResult, String> {
    let data = state.0.lock().map_err(|e| e.to_string())?;
    let job = data
        .jobs
        .iter()
        .find(|j| j.id == job_id)
        .ok_or_else(|| format!("Job not found: {}", job_id))?;
    Ok(engine::validate_rotation(job, &placements, spell_speed))
}

#[tauri::command]
fn calculate_stats(
    state: State<AppState>,
    job_id: String,
    placements: Vec<SkillPlacement>,
    spell_speed: u32,
    duration: f64,
) -> Result<RotationStats, String> {
    let data = state.0.lock().map_err(|e| e.to_string())?;
    let job = data
        .jobs
        .iter()
        .find(|j| j.id == job_id)
        .ok_or_else(|| format!("Job not found: {}", job_id))?;
    Ok(engine::calculate_stats(job, &placements, spell_speed, duration))
}

#[tauri::command]
fn save_rotation(
    state: State<AppState>,
    name: String,
    job_id: String,
    timeline_id: String,
    spell_speed: u32,
    placements: Vec<SkillPlacement>,
) -> Result<String, String> {
    let data = state.0.lock().map_err(|e| e.to_string())?;
    let plan = RotationPlan {
        name,
        job_id,
        timeline_id,
        spell_speed,
        placements,
    };
    data::save_rotation_file(&data.save_dir, &plan)
}

#[tauri::command]
fn load_rotation(path: String) -> Result<RotationPlan, String> {
    data::load_rotation_file(&path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Resolve data directory
            // In dev mode, resource_dir points to target/debug which doesn't have our data,
            // so we fall back to src-tauri/data/ relative to the manifest directory.
            let resource_dir = app
                .handle()
                .path()
                .resource_dir()
                .unwrap_or_else(|_| PathBuf::from("."));

            let data_dir = {
                let bundled = resource_dir.join("data");
                if bundled.join("jobs").exists() {
                    bundled
                } else {
                    // Dev fallback: Cargo.toml lives in src-tauri/, data is src-tauri/data/
                    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
                    manifest.join("data")
                }
            };
            let save_dir = app
                .handle()
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| PathBuf::from("./saves"))
                .join("rotations");

            app.manage(AppState(Mutex::new(AppData {
                data_dir,
                save_dir,
                jobs: Vec::new(),
                timelines: Vec::new(),
            })));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_jobs,
            load_timelines,
            validate_rotation,
            calculate_stats,
            save_rotation,
            load_rotation,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

