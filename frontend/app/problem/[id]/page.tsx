"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getProblem, submitCode } from "@/lib/api";
import { Problem, SubmitResponse } from "@/types";
import Editor from "@/components/Editor";
import ProblemCard from "@/components/ProblemCard";
import MistakeTagBadge from "@/components/MistakeTagBadge";
import { MistakeTag } from "@/types";

const DEFAULT_CODE = `def solution(arr):
    # Write your solution here
    pass
`;

export default function ProblemPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const userId = searchParams.get("user") || "anonymous";
  const sessionNum = parseInt(searchParams.get("session") || "1");

  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);

  useEffect(() => {
    getProblem(id)
      .then(setProblem)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!problem) return;
    setSubmitting(true);
    try {
      const response = await submitCode({
        user_id: userId,
        session_num: sessionNum,
        problem_id: problem.id,
        code,
        language: "python",
      });
      setResult(response);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!result?.next_problem_id) {
      router.push(`/dashboard?user=${userId}`);
      return;
    }
    router.push(
      `/problem/${result.next_problem_id}?user=${userId}&session=${sessionNum + 1}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading problem...</p>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">Problem not found.</p>
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
            Session {sessionNum}
          </span>
          <span className="text-gray-400 text-sm">
            User: <span className="text-white">{userId}</span>
          </span>
          <button
            onClick={() => router.push(`/dashboard?user=${userId}`)}
            className="text-sm text-blue-400 hover:text-blue-300 transition"
          >
            Dashboard →
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left — Problem */}
        <div className="w-2/5 border-r border-gray-800 p-6 overflow-y-auto">
          <ProblemCard problem={problem} />
        </div>

        {/* Right — Editor + Results */}
        <div className="w-3/5 flex flex-col p-6 gap-4">
          <Editor value={code} onChange={setCode} height="350px" />

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition"
          >
            {submitting ? "Analyzing..." : "Submit Solution"}
          </button>

          {/* Results */}
          {result && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex-1 overflow-y-auto">
              <h3 className="font-semibold text-white mb-4">
                Analysis Result
              </h3>

              {result.analysis.detected_mistakes.length === 0 ? (
                <div className="text-green-400 font-medium mb-4">
                  ✓ No cognitive mistakes detected. Great work!
                </div>
              ) : (
                <div className="space-y-4 mb-4">
                  {result.analysis.detected_mistakes.map((mistake, i) => (
                    <div
                      key={i}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <MistakeTagBadge tag={mistake.tag as MistakeTag} />
                        <span className="text-xs text-gray-400">
                          Confidence:{" "}
                          {Math.round(mistake.confidence_score * 100)}%
                        </span>
                        {mistake.line_reference && (
                          <span className="text-xs text-gray-500">
                            {mistake.line_reference}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {mistake.reasoning_summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleNext}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition"
              >
                {result.next_problem_id
                  ? "Next Targeted Problem →"
                  : "View Dashboard →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}