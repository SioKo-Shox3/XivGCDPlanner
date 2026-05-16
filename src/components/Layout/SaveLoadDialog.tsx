import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/timelineStore";
import {
  saveRotation,
  loadRotation,
  listSaves,
  type SaveFileEntry,
} from "@/services/tauriCommands";

type Mode = "save" | "load";

interface Props {
  mode: Mode;
  onClose: () => void;
}

export function SaveLoadDialog({ mode, onClose }: Props) {
  const selectedJobId = useAppStore((s) => s.selectedJobId);
  const selectedTimelineId = useAppStore((s) => s.selectedTimelineId);
  const spellSpeed = useAppStore((s) => s.spellSpeed);
  const selectedLevel = useAppStore((s) => s.selectedLevel);
  const placements = useAppStore((s) => s.placements);
  const loadPlan = useAppStore((s) => s.loadPlan);

  const [saveName, setSaveName] = useState("");
  const [saves, setSaves] = useState<SaveFileEntry[]>([]);
  const [selectedSavePath, setSelectedSavePath] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "error" | "success"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode === "load") {
      listSaves()
        .then(setSaves)
        .catch((e) => setStatus({ type: "error", msg: String(e) }));
    }
  }, [mode]);

  async function handleSave() {
    const name = saveName.trim();
    if (!name) {
      setStatus({ type: "error", msg: "セーブ名を入力してください" });
      return;
    }
    if (!selectedJobId || !selectedTimelineId) {
      setStatus({ type: "error", msg: "ジョブとタイムラインを選択してください" });
      return;
    }
    setBusy(true);
    try {
      await saveRotation(name, selectedJobId, selectedTimelineId, spellSpeed, selectedLevel, placements);
      setStatus({ type: "success", msg: `「${name}」をセーブしました` });
      setTimeout(onClose, 800);
    } catch (e) {
      setStatus({ type: "error", msg: String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function handleLoad() {
    if (!selectedSavePath) {
      setStatus({ type: "error", msg: "ロードするファイルを選択してください" });
      return;
    }
    setBusy(true);
    try {
      const plan = await loadRotation(selectedSavePath);
      loadPlan({
        jobId: plan.jobId,
        timelineId: plan.timelineId,
        spellSpeed: plan.spellSpeed,
        level: plan.level,
        placements: plan.placements,
      });
      onClose();
    } catch (e) {
      setStatus({ type: "error", msg: String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 1000, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col gap-4"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-md)",
          padding: "24px",
          minWidth: 360,
          maxWidth: 480,
          width: "100%",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
            {mode === "save" ? "ローテーションをセーブ" : "ローテーションをロード"}
          </span>
          <button
            className="btn btn-ghost"
            style={{ padding: "0 8px", height: 26, fontSize: 16, lineHeight: 1 }}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div style={{ height: 1, background: "var(--border)" }} />

        {mode === "save" ? (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="ctrl-label">セーブ名</span>
              <input
                className="ctrl"
                style={{ width: "100%", padding: "0 12px" }}
                type="text"
                placeholder="例: P12S 開幕"
                value={saveName}
                maxLength={64}
                autoFocus
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              />
            </label>

            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              ジョブ・レベル・タイムライン・SS・スキル配置をすべて保存します
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2" style={{ maxHeight: 320, overflowY: "auto" }}>
            {saves.length === 0 ? (
              <span style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center", padding: "16px 0" }}>
                セーブデータがありません
              </span>
            ) : (
              saves.map((entry) => (
                <button
                  key={entry.path}
                  onClick={() => setSelectedSavePath(entry.path)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 2,
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid",
                    borderColor: selectedSavePath === entry.path ? "var(--accent)" : "var(--border-strong)",
                    background: selectedSavePath === entry.path ? "var(--accent-subtle)" : "var(--bg-surface)",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "all 0.12s",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                    {entry.name}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {entry.savedAt} UTC
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Status */}
        {status && (
          <div
            style={{
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: "var(--radius-sm)",
              background: status.type === "error" ? "rgba(248,113,113,0.1)" : "rgba(52,211,153,0.1)",
              color: status.type === "error" ? "var(--error-color)" : "var(--ability-color)",
              border: `1px solid ${status.type === "error" ? "rgba(248,113,113,0.2)" : "rgba(52,211,153,0.2)"}`,
            }}
          >
            {status.msg}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            キャンセル
          </button>
          <button
            className="btn"
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "1px solid var(--accent)",
              opacity: busy ? 0.6 : 1,
              cursor: busy ? "wait" : "pointer",
            }}
            onClick={mode === "save" ? handleSave : handleLoad}
            disabled={busy}
          >
            {mode === "save" ? "セーブ" : "ロード"}
          </button>
        </div>
      </div>
    </div>
  );
}
