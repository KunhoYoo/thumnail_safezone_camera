"use client";

import type { Rect } from "@/lib/geometry";
import type { GuideShape } from "@/lib/guides";

type Props = {
  frame: Rect;
  /** width / height */
  aspect: number;
  grid: boolean;
  centerLine: boolean;
  guides: GuideShape[];
  opacity: number;
  showLabels: boolean;
};

const VIEWBOX_WIDTH = 1000;

/** 삼분할선 · 중앙 십자선 · 촬영 가이드를 프레임 비율에 맞춘 SVG 로 그린다. */
export function GuideOverlay({ frame, aspect, grid, centerLine, guides, opacity, showLabels }: Props) {
  if (frame.width <= 0 || frame.height <= 0) return null;
  if (!grid && !centerLine && guides.length === 0) return null;

  const viewBoxHeight = VIEWBOX_WIDTH / aspect;
  const toX = (value: number) => value * VIEWBOX_WIDTH;
  const toY = (value: number) => value * viewBoxHeight;
  const strokeOpacity = Math.min(1, opacity + 0.2);
  const labelStyle = {
    paintOrder: "stroke" as const,
    stroke: "rgba(0,0,0,0.65)",
    strokeWidth: 7,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      className="pointer-events-none absolute"
      style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height }}
      viewBox={"0 0 " + VIEWBOX_WIDTH + " " + viewBoxHeight}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {grid ? (
        <g stroke="#fff" strokeWidth={2} opacity={Math.min(1, opacity * 0.65)}>
          <line x1={VIEWBOX_WIDTH / 3} y1={0} x2={VIEWBOX_WIDTH / 3} y2={viewBoxHeight} />
          <line x1={(VIEWBOX_WIDTH * 2) / 3} y1={0} x2={(VIEWBOX_WIDTH * 2) / 3} y2={viewBoxHeight} />
          <line x1={0} y1={viewBoxHeight / 3} x2={VIEWBOX_WIDTH} y2={viewBoxHeight / 3} />
          <line x1={0} y1={(viewBoxHeight * 2) / 3} x2={VIEWBOX_WIDTH} y2={(viewBoxHeight * 2) / 3} />
        </g>
      ) : null}

      {centerLine ? (
        <g stroke="#fff" strokeWidth={3.5} opacity={strokeOpacity} strokeLinecap="round">
          <line
            x1={VIEWBOX_WIDTH / 2 - 44}
            y1={viewBoxHeight / 2}
            x2={VIEWBOX_WIDTH / 2 + 44}
            y2={viewBoxHeight / 2}
          />
          <line
            x1={VIEWBOX_WIDTH / 2}
            y1={viewBoxHeight / 2 - 44}
            x2={VIEWBOX_WIDTH / 2}
            y2={viewBoxHeight / 2 + 44}
          />
        </g>
      ) : null}

      <g fill="none" stroke="#fff" strokeWidth={3.5} opacity={strokeOpacity}>
        {guides.map((shape, index) => {
          const key = shape.kind + "-" + index;
          switch (shape.kind) {
            case "rect":
              return (
                <rect
                  key={key}
                  x={toX(shape.rect.x)}
                  y={toY(shape.rect.y)}
                  width={toX(shape.rect.width)}
                  height={toY(shape.rect.height)}
                  strokeDasharray={shape.dashed ? "18 12" : undefined}
                />
              );
            case "ellipse":
              return (
                <ellipse
                  key={key}
                  cx={toX(shape.cx)}
                  cy={toY(shape.cy)}
                  rx={toX(shape.rx)}
                  ry={toY(shape.ry)}
                  strokeDasharray="18 12"
                />
              );
            case "hline":
              return (
                <line
                  key={key}
                  x1={0}
                  y1={toY(shape.y)}
                  x2={VIEWBOX_WIDTH}
                  y2={toY(shape.y)}
                  strokeDasharray="22 14"
                />
              );
            case "vline":
              return (
                <line
                  key={key}
                  x1={toX(shape.x)}
                  y1={0}
                  x2={toX(shape.x)}
                  y2={viewBoxHeight}
                  strokeDasharray="22 14"
                />
              );
            case "line":
              return (
                <line
                  key={key}
                  x1={toX(shape.x1)}
                  y1={toY(shape.y1)}
                  x2={toX(shape.x2)}
                  y2={toY(shape.y2)}
                  strokeDasharray="22 14"
                />
              );
            default:
              return null;
          }
        })}
      </g>

      {showLabels ? (
        <g fill="#fff" fontSize={26} fontWeight={600} style={labelStyle}>
          {guides.map((shape, index) => {
            if (!("label" in shape) || !shape.label) return null;
            const key = "label-" + shape.kind + "-" + index;
            switch (shape.kind) {
              case "rect":
                return (
                  <text key={key} x={toX(shape.rect.x) + 10} y={toY(shape.rect.y) - 10}>
                    {shape.label}
                  </text>
                );
              case "ellipse":
                return (
                  <text key={key} x={toX(shape.cx)} y={toY(shape.cy - shape.ry) - 14} textAnchor="middle">
                    {shape.label}
                  </text>
                );
              case "hline":
                return (
                  <text key={key} x={16} y={toY(shape.y) - 12}>
                    {shape.label}
                  </text>
                );
              case "line":
                return (
                  <text key={key} x={toX(Math.min(shape.x1, shape.x2)) + 12} y={toY(Math.min(shape.y1, shape.y2)) - 12}>
                    {shape.label}
                  </text>
                );
              default:
                return null;
            }
          })}
        </g>
      ) : null}
    </svg>
  );
}
