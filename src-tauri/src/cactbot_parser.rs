use crate::models::{BossEvent, BossTimelineDef};

/// Parse a cactbot timeline .txt file into a BossTimelineDef.
///
/// Cactbot timeline format:
///   TIME "ABILITY_NAME" Ability { id: "XXXX", source: "BOSS" }
///   TIME "--sync--" InCombat { ... }   ← skipped
///   TIME "name" ... duration N         ← castTime = N
///   TIME "name" ... jump T             ← loop marker, skipped
pub fn parse(id: &str, name: &str, content: &str) -> Result<BossTimelineDef, String> {
    let mut events: Vec<BossEvent> = Vec::new();
    let mut max_time: f64 = 0.0;

    for line in content.lines() {
        let line = line.trim();

        // Skip empty lines, comments, and non-timeline directives
        if line.is_empty()
            || line.starts_with('#')
            || line.starts_with("hideall")
            || line.starts_with("infotext")
            || line.starts_with("alerttext")
            || line.starts_with("alarmtext")
            || line.starts_with("tts")
        {
            continue;
        }

        // First token must be the timestamp
        let (time_str, rest) = match line.split_once(' ') {
            Some(pair) => pair,
            None => continue,
        };

        let time: f64 = match time_str.parse() {
            Ok(t) => t,
            Err(_) => continue,
        };

        // Name is enclosed in double quotes
        let rest = rest.trim();
        if !rest.starts_with('"') {
            continue;
        }
        let rest_after_open = &rest[1..];
        let close_quote = match rest_after_open.find('"') {
            Some(i) => i,
            None => continue,
        };

        let event_name = &rest_after_open[..close_quote];
        let after_name = rest_after_open[close_quote + 1..].trim();

        // Skip internal sync/reset markers
        if event_name.starts_with("--") && event_name.ends_with("--") {
            continue;
        }

        // Skip loop-back markers (lines with "jump N")
        if after_name.contains(" jump ") || after_name.ends_with(" jump") {
            continue;
        }

        let cast_time = parse_duration(after_name);
        let event_type = classify_event(event_name).to_string();

        if time > max_time {
            max_time = time;
        }

        events.push(BossEvent {
            time,
            name: event_name.to_string(),
            event_type,
            cast_time,
            description: None,
        });
    }

    events.sort_by(|a, b| a.time.partial_cmp(&b.time).unwrap_or(std::cmp::Ordering::Equal));

    // Add a buffer after the last event for the timeline length
    let duration = (max_time + 30.0).ceil();

    Ok(BossTimelineDef {
        id: id.to_string(),
        name: name.to_string(),
        duration,
        events,
    })
}

fn parse_duration(s: &str) -> Option<f64> {
    let idx = s.find("duration ")?;
    let after = &s[idx + 9..];
    let dur_str: String = after
        .chars()
        .take_while(|c| c.is_ascii_digit() || *c == '.')
        .collect();
    dur_str.parse().ok()
}

fn classify_event(name: &str) -> &'static str {
    let lower = name.to_lowercase();

    if lower.contains("enrage")
        || lower.contains("final")
        || lower.contains("time limit")
        || lower.contains("時間切れ")
    {
        return "enrage";
    }
    if lower.contains("buster")
        || lower.contains("cleave")
        || lower.contains("grasp")
        || lower.contains("soul grasp")
        || lower.contains("slash")
    {
        return "tankbuster";
    }
    if lower.contains("ultimate")
        || lower.contains("ultima")
        || lower.contains("holy")
        || lower.contains("raidwide")
        || lower.contains("judgment")
        || lower.contains("meltdown")
    {
        return "raidwide";
    }

    "mechanic"
}
