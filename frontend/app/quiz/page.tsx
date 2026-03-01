"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const QUESTIONS = [
  {
    id: 1,
    type: "mcq",
    question:
      "A function finds the maximum in an array. Which input would most likely cause it to fail if written carelessly?",
    options: [
      "A large array with random numbers",
      "An empty array",
      "An array with all identical elements",
      "An array sorted in descending order",
    ],
    correct: 1,
    tag: "missed_edge_case",
  },
  {
    id: 2,
    type: "fix",
    question: "This function should reverse an array in-place. What is wrong?",
    code: `def reverse_array(arr):
    n = len(arr)
    for i in range(n // 2):
        arr[i], arr[n - i] = arr[n - i], arr[i]
    return arr`,
    options: [
      "The loop range should be range(n)",
      "The swap should use arr[n - i - 1] instead of arr[n - i]",
      "The function should return a new array",
      "Nothing is wrong",
    ],
    correct: 1,
    tag: "off_by_one_error",
  },
  {
    id: 3,
    type: "mcq",
    question:
      "You need to compare adjacent elements in an array of length n. What is the correct loop range?",
    options: [
      "range(n)",
      "range(n - 1)",
      "range(1, n)",
      "range(n + 1)",
    ],
    correct: 1,
    tag: "incorrect_loop_boundary",
  },
  {
    id: 4,
    type: "fix",
    question:
      "This function checks if an array is sorted. What is the bug?",
    code: `def is_sorted(arr):
    for i in range(1, len(arr)):
        if arr[i] < arr[i - 1]:
            return False
    return True`,
    options: [
      "The loop should start at index 0",
      "The comparison should use <= instead of <",
      "The function doesn't handle empty or single-element arrays",
      "Nothing is wrong",
    ],
    correct: 3,
    tag: "base_condition_flaw",
  },
  {
    id: 5,
    type: "mcq",
    question:
      "You need to find if any two numbers in an array sum to a target. A developer uses a nested loop. What is the time complexity and is there a better approach?",
    options: [
      "O(n) — nested loop is optimal here",
      "O(n²) — can be reduced to O(n) using a hash set",
      "O(n log n) — sorting is required first",
      "O(n²) — this is the best possible complexity",
    ],
    correct: 1,
    tag: "unnecessary_nested_loop",
  },
];

const DIFFICULTY_MAP: Record<string, string> = {
  "0-1": "p_001",
  "2-3": "p_005",
  "4-5": "p_008",
};

function getStartingProblem(score: number): string {
  if (score <= 1) return "p_001";
  if (score <= 3) return "p_005";
  return "p_008";
}

function getDifficultyLabel(score: number): {
  label: string;
  color: string;
  desc: string;
} {
  if (score <= 1)
    return {
      label: "Beginner",
      color: "text-green-400",
      desc: "Starting with foundational problems",
    };
  if (score <= 3)
    return {
      label: "Intermediate",
      color: "text-yellow-400",
      desc: "Starting with moderate complexity problems",
    };
  return {
    label: "Advanced",
    color: "text-red-400",
    desc: "Starting with challenging problems",
  };
}

export default function QuizPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("user") || "anonymous";

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const question = QUESTIONS[current];
  const score = answers.filter(Boolean).length;

  const handleSelect = (index: number) => {
    if (showFeedback) return;
    setSelected(index);
  };

  const handleConfirm = () => {
    if (selected === null) return;
    const isCorrect = selected === question.correct;
    setShowFeedback(true);
    setTimeout(() => {
      const newAnswers = [...answers, isCorrect];
      setAnswers(newAnswers);
      setShowFeedback(false);
      setSelected(null);
      if (current + 1 >= QUESTIONS.length) {
        setShowResult(true);
      } else {
        setCurrent((c) => c + 1);
      }
    }, 1000);
  };

  const handleStart = () => {
    const problemId = getStartingProblem(score);
    router.push(`/problem/${problemId}?user=${userId}&session=1`);
  };

  if (showResult) {
    const diff = getDifficultyLabel(score);
    const problemId = getStartingProblem(score);
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-full max-w-md px-6">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
            <h2 className="text-white text-2xl font-black mb-2">
              Baseline Complete
            </h2>
            <p className="text-gray-400 mb-6">
              Your cognitive baseline has been assessed
            </p>

            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <p className="text-gray-400 text-sm mb-1">Score</p>
              <p className="text-5xl font-black text-white mb-3">
                {score}
                <span className="text-2xl text-gray-500">/5</span>
              </p>
              <p className={`text-lg font-bold ${diff.color}`}>{diff.label}</p>
              <p className="text-gray-400 text-sm mt-1">{diff.desc}</p>
            </div>

            <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 mb-6">
              <p className="text-blue-300 text-sm font-medium">
                Starting problem: {problemId}
              </p>
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition"
            >
              Begin Training →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-full max-w-2xl px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-1">
            Logic<span className="text-blue-500">Forge</span>
          </h1>
          <p className="text-gray-400 text-sm">Baseline Assessment</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < current
                  ? "bg-blue-500"
                  : i === current
                  ? "bg-blue-400"
                  : "bg-gray-800"
              }`}
            />
          ))}
        </div>

        {/* Question Card */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Question {current + 1} of {QUESTIONS.length}
            </span>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                question.type === "mcq"
                  ? "bg-blue-900 text-blue-300"
                  : "bg-purple-900 text-purple-300"
              }`}
            >
              {question.type === "mcq" ? "Multiple Choice" : "Find the Bug"}
            </span>
          </div>

          <h3 className="text-white font-semibold text-lg mb-4 leading-relaxed">
            {question.question}
          </h3>

          {question.code && (
            <pre className="bg-gray-800 text-green-300 text-sm font-mono p-4 rounded-xl mb-5 overflow-x-auto leading-relaxed">
              {question.code}
            </pre>
          )}

          <div className="space-y-3">
            {question.options.map((option, i) => {
              let style =
                "border-gray-700 bg-gray-800 text-gray-300 hover:border-blue-500 hover:bg-gray-750";

              if (selected === i && !showFeedback) {
                style = "border-blue-500 bg-blue-950 text-white";
              }

              if (showFeedback) {
                if (i === question.correct) {
                  style = "border-green-500 bg-green-950 text-green-300";
                } else if (i === selected && selected !== question.correct) {
                  style = "border-red-500 bg-red-950 text-red-300";
                } else {
                  style = "border-gray-700 bg-gray-800 text-gray-500";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm ${style}`}
                >
                  <span className="font-mono text-xs mr-3 opacity-50">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {option}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleConfirm}
            disabled={selected === null || showFeedback}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition"
          >
            {showFeedback ? "..." : "Confirm Answer"}
          </button>
        </div>
      </div>
    </div>
  );
}