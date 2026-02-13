"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface ChartData {
  type: "bar" | "line" | "pie" | "area";
  title?: string;
  data: Record<string, string | number>[];
  xKey?: string;
  yKey?: string;
  nameKey?: string;
  dataKey?: string;
  color?: string;
}

const CHART_COLORS = [
  "var(--primary)",
  "oklch(0.7 0.15 160)",
  "oklch(0.7 0.15 280)",
  "oklch(0.7 0.15 40)",
  "oklch(0.7 0.15 210)",
];

export function InteractionChart({ chartData }: { chartData: unknown }) {
  if (!chartData || typeof chartData !== "object") return null;

  const data = chartData as ChartData;
  if (!data.type || !Array.isArray(data.data) || data.data.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 rounded-xl border border-border/50 bg-muted/30 p-3">
      {data.title && (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {data.title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={160}>
        {data.type === "bar" ? (
          <BarChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis
              dataKey={data.xKey ?? "name"}
              tick={{ fontSize: 10 }}
              className="fill-muted-foreground"
            />
            <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "11px",
              }}
            />
            <Bar
              dataKey={data.yKey ?? "value"}
              fill={data.color ?? "var(--primary)"}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        ) : data.type === "line" ? (
          <LineChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis
              dataKey={data.xKey ?? "name"}
              tick={{ fontSize: 10 }}
              className="fill-muted-foreground"
            />
            <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "11px",
              }}
            />
            <Line
              type="monotone"
              dataKey={data.yKey ?? "value"}
              stroke={data.color ?? "var(--primary)"}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        ) : data.type === "area" ? (
          <AreaChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis
              dataKey={data.xKey ?? "name"}
              tick={{ fontSize: 10 }}
              className="fill-muted-foreground"
            />
            <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "11px",
              }}
            />
            <Area
              type="monotone"
              dataKey={data.yKey ?? "value"}
              stroke={data.color ?? "var(--primary)"}
              fill={data.color ?? "var(--primary)"}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </AreaChart>
        ) : (
          <PieChart>
            <Pie
              data={data.data}
              nameKey={data.nameKey ?? "name"}
              dataKey={data.dataKey ?? "value"}
              cx="50%"
              cy="50%"
              outerRadius={60}
              innerRadius={30}
              paddingAngle={2}
              label={false}
            >
              {data.data.map((_, i) => (
                <Cell
                  key={i}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "11px",
              }}
            />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
