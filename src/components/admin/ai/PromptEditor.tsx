"use client";

interface Prompt {
  id: number;
  keyword: string;
  category: string;
  response: string;
}

import { useState, useEffect } from "react";
import { FileJson, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/badge";

export function PromptEditor({ className }: { className?: string }) {
  const { showToast } = useToast();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrompts();
  }, []);

  async function loadPrompts() {
    try {
      const res = await fetch("/api/ai-responses");
      const json = await res.json();
      if (json.success) setPrompts(json.data);
    } catch {
      showToast("error", "Failed to load prompts");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/ai-responses/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Prompt deleted");
        loadPrompts();
      }
    } catch {
      showToast("error", "Failed to delete prompt");
    }
  }

  if (loading) return <div className="text-xs text-white/30 py-4 text-center">Loading prompts...</div>;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/30">{prompts.length} templates</span>
      </div>

      {prompts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.06] p-6 text-center">
          <p className="text-sm text-white/30">No prompt templates yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {prompts.map((prompt: Prompt) => (
            <div
              key={prompt.id}
              className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileJson size={14} className="text-neon-cyan" />
                  <span className="text-white/70 font-medium text-sm">{prompt.keyword}</span>
                </div>
                <Badge variant="outline" className="text-[9px]">{prompt.category}</Badge>
              </div>
              <p className="text-xs text-white/25 font-mono line-clamp-2 mb-2">{prompt.response}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/20">{prompt.response?.split(/\s+/).length || 0} words</span>
                <button
                  onClick={() => handleDelete(prompt.id)}
                  className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-red-500/10 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
