"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSessions } from "@/lib/api";

export default function Home() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    if (!userId.trim()) return;
    setLoading(true);

    try {
      const sessions = await getSessions(userId.trim());

      if (sessions.total_sessions === 0) {
        // new user — take quiz first
        router.push(`/quiz?user=${userId.trim()}`);
      } else {
        // returning user — skip quiz, go straight to next problem
        const nextSession = sessions.total_sessions + 1;
        const lastProblemId = sessions.sessions[sessions.sessions.length - 1].problem_id;
        router.push(`/problem/${lastProblemId}?user=${userId.trim()}&session=${nextSession}`);
      }
    } catch {
      // user doesn't exist yet — send to quiz
      router.push(`/quiz?user=${userId.trim()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-white tracking-tight mb-3">
            Logic<span className="text-blue-500">Forge</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Not adaptive difficulty.{" "}
            <span className="text-white font-medium">Adaptive cognition.</span>
          </p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <h2 className="text-white font-semibold text-lg mb-6">
            Enter your ID to continue
          </h2>

          <input
            type="text"
            placeholder="e.g. john_doe"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition mb-4"
          />

          <button
            onClick={handleStart}
            disabled={!userId.trim() || loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition text-sm"
          >
            {loading ? "Checking..." : "Start Training →"}
          </button>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Detect", desc: "Cognitive mistake patterns" },
            { label: "Target", desc: "Weakness-focused problems" },
            { label: "Extinct", desc: "Track mistake elimination" },
          ].map((item) => (
            <div key={item.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-blue-400 font-bold text-sm">{item.label}</p>
              <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
