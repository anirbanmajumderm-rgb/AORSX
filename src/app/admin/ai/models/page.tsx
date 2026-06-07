"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Settings, Key, FileJson
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { useToast } from "@/components/ui/Toast";

export default function AIModelsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const { showToast } = useToast();
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [aiResponses, setAiResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [keysRes, responsesRes] = await Promise.all([
        fetch("/api/admin/api-keys"),
        fetch("/api/ai-responses"),
      ]);
      const [keysJson, responsesJson] = await Promise.all([
        keysRes.json(), responsesRes.json(),
      ]);
      if (keysJson.success) setApiKeys(keysJson.data);
      if (responsesJson.success) setAiResponses(responsesJson.data);
    } catch {
      showToast("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="space-y-6 p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-neon-cyan" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-white/30">Loading...</span>
        </div>
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="AI Models & Services" description="Manage AI configuration, prompts, and API keys">
        <Button size="sm" className="h-9 text-xs gap-1.5" onClick={() => window.location.href = "/admin/ai-training"}>
          <Settings size={14} /> Configure AI
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-cyan/10 border border-neon-cyan/20">
              <FileJson size={18} className="text-neon-cyan" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/80">Prompt Templates</h3>
              <p className="text-[11px] text-white/30">{aiResponses.length} templates configured</p>
            </div>
          </div>
          <div className="space-y-2">
            {aiResponses.slice(0, 5).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                <span className="text-xs text-white/60">{r.keyword}</span>
                <Badge variant="outline" className="text-[9px]">{r.category}</Badge>
              </div>
            ))}
            {aiResponses.length === 0 && (
              <p className="text-xs text-white/20">No prompts yet</p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-xs mt-3" onClick={() => window.location.href = "/admin/ai?tab=prompts"}>
            Manage Prompts
          </Button>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Key size={18} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/80">API Keys</h3>
              <p className="text-[11px] text-white/30">{apiKeys.length} keys registered</p>
            </div>
          </div>
          <div className="space-y-2">
            {apiKeys.slice(0, 5).map((k: any) => (
              <div key={k.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                <span className="text-xs text-white/60">{k.name}</span>
                <Badge variant={k.status === "active" ? "success" : "secondary"} className="text-[9px]">{k.status}</Badge>
              </div>
            ))}
            {apiKeys.length === 0 && (
              <p className="text-xs text-white/20">No API keys yet</p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-xs mt-3" onClick={() => window.location.href = "/admin/ai?tab=keys"}>
            Manage Keys
          </Button>
        </div>
      </div>
    </div>
  );
}
