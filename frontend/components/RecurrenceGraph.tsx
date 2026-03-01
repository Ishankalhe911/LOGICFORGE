"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AnalyticsResponse } from "@/types";

const TAG_COLORS: Record<string, string> = {
  missed_edge_case: "#ef4444",
  off_by_one_error: "#f97316",
  incorrect_loop_boundary: "#eab308",
  unnecessary_nested_loop: "#a855f7",
  base_condition_flaw: "#3b82f6",
  redundant_computation: "#22c55e",
};

interface Props {
  analytics: AnalyticsResponse;
}

export default function RecurrenceGraph({ analytics }: Props) {
  const { recurrence_data } = analytics;

  if (!recurrence_data || Object.keys(recurrence_data).length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No data yet. Complete at least one session to see your graph.
      </div>
    );
  }

  // build chart data — one entry per session
  const allSessions = Array.from(
    new Set(
      Object.values(recurrence_data).flatMap((d) =>
        Object.keys(d.sessions).map(Number)
      )
    )
  ).sort((a, b) => a - b);

  const chartData = allSessions.map((session) => {
    const entry: Record<string, number | string> = {
      session: `Session ${session}`,
    };
    Object.entries(recurrence_data).forEach(([tag, data]) => {
      entry[tag] = data.sessions[session] ?? 0;
    });
    return entry;
  });

  const activeTags = Object.keys(recurrence_data);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        Cognitive Mistake Recurrence
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Downward trend = cognitive improvement
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="session" tick={{ fontSize: 12 }} />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            label={{
              value: "Occurrences",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11 },
            }}
          />
          <Tooltip />
          <Legend />
          {activeTags.map((tag) => (
            <Line
              key={tag}
              type="monotone"
              dataKey={tag}
              stroke={TAG_COLORS[tag] || "#888"}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {analytics.extinction_report.extinguished.length > 0 && (
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <p className="text-xs font-semibold text-green-700 mb-1">
              ✓ Extinguished
            </p>
            {analytics.extinction_report.extinguished.map((tag) => (
              <p key={tag} className="text-xs text-green-600">
                {tag.replace(/_/g, " ")}
              </p>
            ))}
          </div>
        )}
        {analytics.extinction_report.active.length > 0 && (
          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <p className="text-xs font-semibold text-red-700 mb-1">
              ⚠ Still Active
            </p>
            {analytics.extinction_report.active.map((tag) => (
              <p key={tag} className="text-xs text-red-600">
                {tag.replace(/_/g, " ")}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}