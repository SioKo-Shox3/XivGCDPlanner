import { useRef, useState } from "react";
import { useAppStore } from "@/stores/timelineStore";
import { parseCactbotTimeline } from "@/services/tauriCommands";

interface Props {
  onClose: () => void;
}

export function ImportTimelineDialog({ onClose }: Props) {
  const addTimeline = useAppStore((s) => s.addTimeline);
  const selectTimeline = useAppStore((s) => s.selectTimeline);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "error" | "success"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setContent(text);
      const headerMatch = text.match(/^###\s*(.+)/m);
      if (headerMatch) {
        const raw = headerMatch[1].trim();
        setName(raw);
        const autoId = raw.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
        setId(autoId);
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    const trimId = id.trim();
    const trimName = name.trim();
    if (!trimId) { setStatus({ type: "error", msg: "IDを入力してください" }); return; }
    if (!trimName) { setStatus({ type: "error", msg: "名前を入力してください" }); return; }
    if (!content) { setStatus({ type: "error", msg: "ファイルを選択してください" }); return; }

    setBusy(true);
    setStatus(null);
    try {
      const timeline = await parseCactbotTimeline(trimId, trimName, content);
      addTimeline(timeline);
      selectTimeline(timeline.id);
      setStatus({ type: "success", msg: `「${timeline.name}」をインポートしました (${timeline.events.length}イベント)` });
    } catch (e) {
      setStatus({ type: "error", msg: String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-lg p-6 flex flex-col gap-4 w-[480px]"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          タイムラインをインポート
        </h2>

        {/* File picker */}
        <div className="flex flex-col gap-1">
          <span className="ctrl-label">タイムラインファイル (.txt)</span>
          <div className="flex gap-2 items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              className="hidden"
              onChange={handleFileChange}
            />
            <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()} disabled={busy}>
              ファイルを選択
            </button>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {fileName ?? "未選択"}
            </span>
          </div>
        </div>

        {/* ID input */}
        <div className="flex flex-col gap-1">
          <span className="ctrl-label">ID (英数字・アンダースコア)</span>
          <input
            className="ctrl w-full"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="例: e8s_eden_promise"
            disabled={busy}
          />
        </div>

        {/* Name input */}
        <div className="flex flex-col gap-1">
          <span className="ctrl-label">表示名</span>
          <input
            className="ctrl w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: ヘビー級零式 1層"
            disabled={busy}
          />
        </div>

        {status && (
          <p
            className="text-xs"
            style={{ color: status.type === "error" ? "var(--danger)" : "var(--accent)" }}
          >
            {status.msg}
          </p>
        )}

        <div className="flex gap-2 justify-end mt-2">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>キャンセル</button>
          <button
            className="btn"
            style={{ background: "var(--accent)", color: "#fff" }}
            onClick={handleImport}
            disabled={busy || !content}
          >
            {busy ? "インポート中..." : "インポート"}
          </button>
        </div>
      </div>
    </div>
  );
}
