import { useCallback, useRef, useState } from "react";
import { useAppStore } from "@/stores/timelineStore";
import type { SkillPlacement } from "@/types";

interface Props {
  placement: SkillPlacement;
  name: string;
  widthSeconds: number;
  castTime?: number;
  pps: number;
  color: string;
  error?: string;
}

export function SkillBlock({ placement, name, widthSeconds, castTime, pps, color, error }: Props) {
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
      className="absolute top-2 bottom-2 rounded cursor-move flex flex-col overflow-hidden select-none transition-shadow"
      style={{
        left,
        width: Math.max(width, 8),
        background: bgColor,
        border: `1.5px solid ${borderCol}`,
        boxShadow: isSelected ? `0 0 8px ${borderCol}` : undefined,
        opacity: dragging ? 0.8 : 1,
        zIndex: isSelected ? 20 : 10,
      }}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
      title={`${name}\n${placement.time.toFixed(2)}s${error ? "\n⚠ " + error : ""}`}
    >
      {/* Cast time section */}
      {castTime != null && castTime > 0 && (
        <div
          className="absolute top-0 bottom-0 left-0"
          style={{
            width: (castTime / widthSeconds) * 100 + "%",
            background: `color-mix(in srgb, ${color} 50%, transparent)`,
            borderRight: `1px solid ${color}`,
          }}
        />
      )}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <span className="text-[10px] font-medium text-center leading-tight px-0.5 truncate">
          {name}
        </span>
      </div>
      {hasError && (
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "var(--error-color)" }} />
      )}
    </div>
  );
}
