"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, MessageSquare, Save, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/admin/shared/ConfirmModal";

interface Question {
  id: number;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string | null;
  question: string;
  adminReply: string | null;
  isImportant: boolean;
  isSpam: boolean;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  answered: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  published: "bg-green-500/10 text-green-400 border-green-500/20",
  resolved: "bg-green-500/10 text-green-400 border-green-500/20",
  spam: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function AdminQuestionsPage() {
  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/questions");
      const json = await res.json();
      if (json.success) setItems(json.data);
      else toast.error(json.error || "Failed to load");
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleAnswer(questionId: number, status: string) {
    if (!answerText.trim()) { toast.error("Answer is required"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminReply: answerText, status }),
      });
      const json = await res.json();
      if (json.success) { toast.success("Answered"); setAnswerText(""); setAnsweringId(null); load(); }
      else toast.error(json.error || "Failed");
    } catch { toast.error("Failed to answer"); }
    finally { setSaving(false); }
  }

  async function handleAction(question: Question, updates: Record<string, any>) {
    try {
      const res = await fetch(`/api/questions/${question.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (json.success) { toast.success("Updated"); load(); }
      else toast.error(json.error || "Failed");
    } catch { toast.error("Failed to update"); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/questions/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) { toast.success("Deleted"); setDeleteTarget(null); load(); }
      else toast.error(json.error || "Failed to delete");
    } catch { toast.error("Failed to delete"); }
  }

  if (loading) return <div className="p-6 animate-pulse space-y-6"><div className="h-8 w-48 bg-white/5 rounded-lg" /><div className="h-96 bg-white/5 rounded-2xl" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Questions</h1>
          <p className="text-sm text-white/40 mt-1">User-submitted questions and inquiries</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/60 hover:text-white/80 transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-orange-500/[0.04] border border-orange-500/10 p-4 text-center">
          <p className="font-heading text-2xl font-bold text-orange-400">{items.filter((q) => q.status === "pending").length}</p>
          <p className="text-xs text-white/30 mt-1">Pending</p>
        </div>
        <div className="rounded-xl bg-blue-500/[0.04] border border-blue-500/10 p-4 text-center">
          <p className="font-heading text-2xl font-bold text-blue-400">{items.filter((q) => q.status === "answered").length}</p>
          <p className="text-xs text-white/30 mt-1">Answered</p>
        </div>
        <div className="rounded-xl bg-green-500/[0.04] border border-green-500/10 p-4 text-center">
          <p className="font-heading text-2xl font-bold text-green-400">{items.filter((q) => q.status === "published" || q.status === "resolved").length}</p>
          <p className="text-xs text-white/30 mt-1">Resolved</p>
        </div>
        <div className="rounded-xl bg-red-500/[0.04] border border-red-500/10 p-4 text-center">
          <p className="font-heading text-2xl font-bold text-red-400">{items.filter((q) => q.isSpam || q.status === "spam").length}</p>
          <p className="text-xs text-white/30 mt-1">Spam</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-12 text-center">
            <p className="text-sm text-white/30">No questions yet.</p>
          </div>
        )}
        {items.map((q) => (
          <motion.div key={q.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={cn("rounded-2xl border overflow-hidden transition-all", q.isSpam ? "bg-red-500/[0.02] border-red-500/10" : "bg-white/[0.02] border-white/[0.04]")}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white/90">{q.visitorName}</span>
                    <span className="text-xs text-white/30">{q.visitorEmail}</span>
                    {q.visitorPhone && <span className="text-xs text-white/20">{q.visitorPhone}</span>}
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed">{q.question}</p>
                  <p className="text-[10px] text-white/20 mt-1">{new Date(q.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", statusColors[q.status] || statusColors.pending)}>{q.status}</span>
                  {!q.isSpam && q.status !== "spam" && (
                    <button onClick={() => handleAction(q, { isSpam: true, status: "spam" })} className="p-1.5 rounded-lg text-red-400/30 hover:text-red-400 hover:bg-red-500/5 transition-all" title="Mark as spam"><XCircle className="w-3.5 h-3.5" /></button>
                  )}
                  <button onClick={() => setDeleteTarget(q)} className="p-1.5 rounded-lg text-red-400/30 hover:text-red-400 hover:bg-red-500/5 transition-all" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {q.adminReply && (
                <div className="ml-4 pl-4 border-l-2 border-neon-cyan/20 mb-3">
                  <p className="text-xs text-neon-cyan/60 mb-1">Admin Reply:</p>
                  <p className="text-sm text-white/60">{q.adminReply}</p>
                </div>
              )}

              {answeringId === q.id ? (
                <div className="space-y-3 mt-3 pt-3 border-t border-white/[0.04]">
                  <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Type your answer..." rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleAnswer(q.id, "published")} disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/10 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-all disabled:opacity-50"
                    ><CheckCircle className="w-3.5 h-3.5" /> Publish</button>
                    <button onClick={() => handleAnswer(q.id, "answered")} disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 text-white/50 text-sm font-medium hover:bg-white/10 transition-all disabled:opacity-50"
                    ><Save className="w-3.5 h-3.5" /> Save Private</button>
                    <button onClick={() => setAnsweringId(null)} className="px-4 py-2 rounded-xl border border-white/[0.06] text-sm text-white/40 hover:text-white/60 transition-all">Cancel</button>
                  </div>
                </div>
              ) : !q.adminReply && !q.isSpam && q.status !== "spam" && (
                <button onClick={() => { setAnsweringId(q.id); setAnswerText(""); }}
                  className="flex items-center gap-1.5 text-xs text-neon-cyan/60 hover:text-neon-cyan transition-all mt-2"
                ><MessageSquare className="w-3.5 h-3.5" /> Answer this question</button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <ConfirmModal open={!!deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} title="Delete Question" description={`Delete question from "${deleteTarget?.visitorName}"?`} confirmText="Delete" variant="danger" />
    </div>
  );
}
