import { Session } from "@/types";
import MistakeTagBadge from "./MistakeTagBadge";
import { MistakeTag } from "@/types";

export default function SessionSummary({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No sessions yet. Solve a problem to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div
          key={session.session_num}
          className="bg-white rounded-xl border border-gray-200 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-800">
              Session {session.session_num}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(session.submitted_at).toLocaleDateString()}
            </span>
          </div>
          <div className="text-xs text-gray-500 mb-3">
            Problem: {session.problem_id}
          </div>
          {session.clean_tags.length === 0 ? (
            <span className="text-green-600 text-sm font-medium">
              ✓ No mistakes detected
            </span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {session.clean_tags.map((tag) => (
                <MistakeTagBadge key={tag} tag={tag as MistakeTag} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}