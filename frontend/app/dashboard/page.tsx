"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSessions, getAnalytics } from "@/lib/api";
import { SessionsResponse, AnalyticsResponse } from "@/types";
import RecurrenceGraph from "@/components/RecurrenceGraph";
import SessionSummary from "@/components/SessionSummary";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("user") || "anonymous";

  const [sessions, setSessions] = useState<SessionsResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSessions(userId), getAnalytics(userId)])
      .then(([s, a]) => {
        setSessions(s);
        setAnalytics(a);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const nextSession = sessions ? sessions.total_sessions + 1 : 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-black">
          Logic<span className="text-blue-500">Forge</span>
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">
            User: <span className="text-white">{userId}</span>
          </span>
          <button
            onClick={() =>
              router.push(`/problem/p_001?user=${userId}&session=${nextSession}`)
            }
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            Continue Training →
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <p className="text-gray-400 text-sm mb-1">Total Sessions</p>
            <p className="text-3xl font-black text-white">
              {sessions?.total_sessions || 0}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <p className="text-gray-400 text-sm mb-1">Dominant Weakness</p>
            <p className="text-sm font-semibold text-red-400 mt-2">
              {analytics?.dominant_weakness
                ? analytics.dominant_weakness.replace(/_/g, " ")
                : "None detected yet"}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <p className="text-gray-400 text-sm mb-1">Mistakes Extinguished</p>
            <p className="text-3xl font-black text-green-400">
              {analytics?.extinction_report?.extinguished?.length || 0}
            </p>
          </div>
        </div>

        {/* Graph + Sessions */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            {analytics && <RecurrenceGraph analytics={analytics} />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-4">
              Session History
            </h3>
            <SessionSummary sessions={sessions?.sessions || []} />
          </div>
        </div>
      </div>
    </div>
  );
}