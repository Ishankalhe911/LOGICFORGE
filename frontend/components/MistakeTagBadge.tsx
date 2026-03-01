import { MistakeTag } from "@/types";

const TAG_CONFIG: Record<MistakeTag, { label: string; color: string }> = {
  missed_edge_case: {
    label: "Missed Edge Case",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  off_by_one_error: {
    label: "Off By One",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  incorrect_loop_boundary: {
    label: "Loop Boundary",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  unnecessary_nested_loop: {
    label: "Nested Loop",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  base_condition_flaw: {
    label: "Base Condition",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  redundant_computation: {
    label: "Redundant Computation",
    color: "bg-green-100 text-green-700 border-green-200",
  },
};

export default function MistakeTagBadge({ tag }: { tag: MistakeTag }) {
  const config = TAG_CONFIG[tag];
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      {config.label}
    </span>
  );
}