import { useCallback, useRef, useState } from "react";
import { useAppStore } from "@/stores/timelineStore";
import type { SkillPlacement } from "@/types";

interface Props {
  placement: SkillPlacement;
  name: string;
  icon?: string;
  widthSeconds: number;
  castTime?: number;
  pps: number;
  color: string;
  error?: string;
}

export function SkillBlock({ placement, name, icon, widthSeconds, castTime, pps, color, error }: Props) {
  const removePlacement = useAppStore((s) => s.removePlacement);
  const movePlacement = useAppStore((s) => s.movePlacement);
  const selectPlacement = useAppStore((s) => s.selectPlacement);
  const selectedId = useAppStore((s) => s.view.selectedPlacementId);

  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartTime = useRef(0);

  const left = placement.time * pps;
  const width = widthSeconds * pps;
  const isSelected = selectedId === placement.id;
  const hasError = !!error;

  const bgColor = hasError ? "rgba(239,68,68,0.3)" : `color-mix(in srgb, ${color} 30%, transparent)`;
  const borderCol = hasError ? "var(--error-color)" : isSelected ? "#fff" : color;

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 2) return; // right click
      e.stopPropagation();
      selectPlacement(placement.id);
      setDragging(true);
      dragStartX.current = e.clientX;
      dragStartTime.current = placement.time;

      const onMouseMove = (me: MouseEvent) => {
        const dx = me.clientX - dragStartX.current;
        const dt = dx / pps;
        const newTime = Math.max(0, Math.round((dragStartTime.current + dt) * 100) / 100);
        movePlacement(placement.id, newTime);
      };
      const onMouseUp = () => {
        setDragging(false);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [placement.id, placement.time, pps, selectPlacement, movePlacement]
  );

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      removePlacement(placement.id);
    },
    [placement.id, removePlacement]
  );

  return (
    <div
      className="absolute top-1.5 bottom-1.5 rounded-md cursor-move flex flex-col overflow-hidden select-none"
      style={{
        left,
        width: Math.max(width, 8),
        background: bgColor,
        border: `1px solid ${borderCol}`,
        boxShadow: isSelected ? `0 0 10px ${borderCol}40, 0 0 4px ${borderCol}20` : "var(--shadow-sm)",
        opacity: dragging ? 0.75 : 1,
        zIndex: isSelected ? 20 : 10,
        transition: "box-shadow 0.15s, opacity 0.1s",
      }}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
      title={`${name}\n${placement.time.toFixed(2)}s${error ? "\n⚠ " + error : ""}`}
    >
      {/* Cast time section */}
      {castTime != null && castTime > 0 && (
        <div
          className="absolute top-0 bottom-0 left-0 rounded-l-md"
          style={{
            width: (castTime / widthSeconds) * 100 + "%",
            background: `color-mix(in srgb, ${color} 40%, transparent)`,
            borderRight: `1px solid color-mix(in srgb, ${color} 60%, transparent)`,
          }}
        />
      )}
      <div className="flex-1 flex items-center justify-center relative z-10 gap-0.5 px-0.5">
        {icon && (
          <img
            src={icon}
            alt={name}
            className="w-5 h-5 flex-shrink-0 rounded-sm"
            draggable={false}
            style={{ imageRendering: "auto", filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.4))" }}
          />
        )}
        <span className="text-[9px] font-medium text-center leading-tight truncate" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
          {name}
        </span>
      </div>
      {hasError && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--error-color)" }} />
      )}
    </div>
  );
}
