"use client";

import { ParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";
import { LinePath } from "@visx/shape";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { curveMonotoneX } from "@visx/curve";
import { Text } from "@visx/text";
import { engineA } from "@/lib/data";

type Pt = { x: number; y: number };

const BIO = "oklch(0.83 0.18 175)";
const FIBER = "oklch(0.74 0.17 45)";
const RULE = "oklch(0.65 0.01 240 / 0.5)";
const MUTED = "oklch(0.65 0.01 240)";

function Chart({ width, height }: { width: number; height: number }) {
  const t = engineA.tradeoff;
  const margin = { top: 16, right: 20, bottom: 36, left: 40 };
  const iw = Math.max(0, width - margin.left - margin.right);
  const ih = Math.max(0, height - margin.top - margin.bottom);

  const xScale = scaleLinear<number>({
    domain: [t.x[0]!, t.x[t.x.length - 1]!],
    range: [0, iw],
  });
  const yScale = scaleLinear<number>({ domain: [0, 1], range: [ih, 0] });

  const degr: Pt[] = t.x.map((x, i) => ({ x, y: t.degradability[i]! }));
  const mech: Pt[] = t.x.map((x, i) => ({ x, y: t.mechanicalRetention[i]! }));

  const wx0 = xScale(t.designWindow[0]);
  const wx1 = xScale(t.designWindow[1]);

  return (
    <svg width={width} height={height}>
      <Group left={margin.left} top={margin.top}>
        {/* shaded design window */}
        <rect x={wx0} y={0} width={wx1 - wx0} height={ih} fill="oklch(0.83 0.18 175 / 0.08)" />
        <line x1={wx0} x2={wx0} y1={0} y2={ih} stroke="oklch(0.83 0.18 175 / 0.45)" strokeDasharray="3 3" />
        <line x1={wx1} x2={wx1} y1={0} y2={ih} stroke="oklch(0.83 0.18 175 / 0.45)" strokeDasharray="3 3" />

        <LinePath<Pt>
          data={degr}
          x={(d) => xScale(d.x)}
          y={(d) => yScale(d.y)}
          stroke={BIO}
          strokeWidth={2.5}
          curve={curveMonotoneX}
        />
        <LinePath<Pt>
          data={mech}
          x={(d) => xScale(d.x)}
          y={(d) => yScale(d.y)}
          stroke={FIBER}
          strokeWidth={2.5}
          curve={curveMonotoneX}
        />

        <AxisBottom
          top={ih}
          scale={xScale}
          numTicks={8}
          stroke={RULE}
          tickStroke={RULE}
          tickLabelProps={() => ({
            fill: MUTED,
            fontSize: 9,
            fontFamily: "var(--font-mono)",
            textAnchor: "middle",
          })}
          label="hard-segment wt%"
          labelProps={{ fill: MUTED, fontSize: 9, fontFamily: "var(--font-mono)", textAnchor: "middle" }}
        />
        <AxisLeft
          scale={yScale}
          numTicks={4}
          stroke={RULE}
          tickStroke={RULE}
          tickLabelProps={() => ({
            fill: MUTED,
            fontSize: 9,
            fontFamily: "var(--font-mono)",
            textAnchor: "end",
            dx: -2,
            dy: 3,
          })}
        />

        <Text x={xScale(14)} y={14} fontSize={8.5} fill={MUTED} fontFamily="var(--font-mono)" textAnchor="middle">
          &lt;17 wt%: too fast
        </Text>
        <Text x={xScale(42.5)} y={14} fontSize={8.5} fill={MUTED} fontFamily="var(--font-mono)" textAnchor="middle">
          &gt;40 wt%: won&apos;t degrade
        </Text>
        <Text
          x={(wx0 + wx1) / 2}
          y={ih - 8}
          fontSize={8.5}
          fill="oklch(0.83 0.18 175)"
          fontFamily="var(--font-mono)"
          textAnchor="middle"
        >
          25-35 window
        </Text>
      </Group>
    </svg>
  );
}

export function TradeoffCurve() {
  return (
    <div className="h-[340px] w-full">
      <ParentSize>{({ width, height }) => (width > 0 ? <Chart width={width} height={height} /> : null)}</ParentSize>
    </div>
  );
}
