import { Problem } from "@/types";

const DIFFICULTY_MAP: Record<number, { label: string; color: string }> = {
  1: { label: "Easy", color: "text-green-600" },
  2: { label: "Medium", color: "text-yellow-600" },
  3: { label: "Hard", color: "text-red-600" },
};

export default function ProblemCard({ problem }: { problem: Problem }) {
  const diff = DIFFICULTY_MAP[problem.difficulty];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">{problem.title}</h2>
        <span className={`text-sm font-semibold ${diff.color}`}>
          {diff.label}
        </span>
      </div>
      <div className="prose prose-sm max-w-none">
        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
          {problem.description}
        </pre>
      </div>
    </div>
  );
}