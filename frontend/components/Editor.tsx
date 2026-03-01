"use client";

import MonacoEditor from "@monaco-editor/react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
}

export default function Editor({
  value,
  onChange,
  language = "python",
  height = "400px",
}: EditorProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="text-gray-400 text-xs ml-2 font-mono">{language}</span>
      </div>
      <MonacoEditor
        height={height}
        language={language}
        value={value}
        onChange={(val) => onChange(val || "")}
        theme="vs-dark"
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 4,
          lineNumbers: "on",
          renderLineHighlight: "all",
          padding: { top: 12 },
        }}
      />
    </div>
  );
}