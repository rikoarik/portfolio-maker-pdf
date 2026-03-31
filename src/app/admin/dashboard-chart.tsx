"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type AdminTrendPoint = { dateLabel: string; value: number };

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}) {
  if (!active) return null;
  const v = payload?.[0]?.value;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold text-zinc-900">{label}</p>
      <p className="mt-1 text-xs text-zinc-600">
        <span className="font-semibold tabular-nums text-zinc-900">
          {typeof v === "number" ? v : 0}
        </span>{" "}
        user baru
      </p>
    </div>
  );
}

export function AdminAreaTrendChart({
  data,
  ariaLabel,
}: {
  data: AdminTrendPoint[];
  ariaLabel: string;
}) {
  const max = Math.max(0, ...data.map((d) => d.value));
  return (
    <div
      className="h-56 w-full"
      role="img"
      aria-label={`${ariaLabel}. Maksimum: ${max}.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
              <stop offset="75%" stopColor="#4f46e5" stopOpacity={0.06} />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e4e4e7" />
          <XAxis
            dataKey="dateLabel"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#71717a" }}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            width={30}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#71717a" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#4f46e5"
            strokeWidth={2}
            fill="url(#trendFill)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

