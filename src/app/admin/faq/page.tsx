"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Save, CheckCircle, XCircle, MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/admin/shared/ConfirmModal";

export default function FAQPage() {
  const [faqItems, setFaqItems] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("faq");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [showNewFaq, setShowNewFaq] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch("/api/admin/faq");
      const json = await res.json();
      if (json.success) {
        const data = json.data || json;
        setFaqItems(data.faqItems || []);
        setQuestions(data.questions || []);
      }
    } catch {
      toast.error("Failed to load FAQ data");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFaq() {
    if (!newFaq.question) { toast.error("Question is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "faq", ...newFaq }),
      });
      const json = await res.json();
      if (json.success || json.id) {
        toast.success("FAQ created");
        setNewFaq({ question: "", answer: "" });
        setShowNewFaq(false);
        loadData();
      }
    } catch {
      toast.error("Failed to create FAQ");
    } finally {
      setSaving(false);
    }
  }

  async function handleAnswer(questionId: number, status: string) {
    if (!answerText.trim()) { toast.error("Answer is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "answer", questionId: String(questionId), answer: answerText, status }),
      });
      const json = await res.json();
      if (json.success || json.id) {
        toast.success("Question answered");
        setAnswerText("");
        setAnsweringId(null);
        loadData();
      }
    } catch {
      toast.error("Failed to answer question");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, type: string) {
    try {
      const res = await fetch(`/api/admin/faq/${id}?type=${type}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Deleted");
        setDeleteTarget(null);
        loadData();
      }
    } catch {
      toast.error("Failed to delete");
    }
  }

  const statusColors: Record<string, string> = {
    pending: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    answered: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    published: "bg-green-500/10 text-green-400 border-green-500/20",
    private: "bg-white/5 text-white/40 border-white/[0.06]",
    spam: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="h-64 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">FAQ & Questions</h1>
          <p className="text-sm text-white/40 mt-1">Manage FAQs and user-submitted questions</p>
        </div>
        <button
          onClick={() => setShowNewFaq(!showNewFaq)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold text-sm hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> New FAQ
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/[0.04] pb-2">
        <button onClick={() => setTab("faq")} className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-all", tab === "faq" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60")}>
          FAQ Items ({faqItems.length})
        </button>
        <button onClick={() => setTab("submissions")} className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-all", tab === "submissions" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60")}>
          Submissions ({questions.length})
        </button>
      </div>

      {/* New FAQ Form */}
      {showNewFaq && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-white/70">Create FAQ Item</h3>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Question</label>
            <input value={newFaq.question} onChange={(e) => setNewFaq(p => ({ ...p, question: e.target.value }))} className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Answer</label>
            <textarea value={newFaq.answer} onChange={(e) => setNewFaq(p => ({ ...p, answer: e.target.value }))} rows={4} className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 resize-none" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowNewFaq(false)} className="px-4 py-2 rounded-xl border border-white/[0.06] text-sm text-white/50 hover:text-white/70">Cancel</button>
            <button onClick={handleCreateFaq} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create
            </button>
          </div>
        </motion.div>
      )}

      {/* FAQ Items */}
      {tab === "faq" && (
        <div className="space-y-2">
          {faqItems.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
              <div
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
              >
                <span className="text-sm font-medium text-white/80">{item.question}</span>
                <div className="flex items-center gap-3">
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border", item.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/5 text-white/30 border-white/[0.06]")}>
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: item.id, type: "faq" }); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {expandedId === item.id && item.answer && (
                <div className="px-5 pb-5 pt-0 border-t border-white/[0.04]">
                  <p className="text-sm text-white/50 leading-relaxed mt-3">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
          {faqItems.length === 0 && (
            <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-12 text-center">
              <p className="text-sm text-white/30">No FAQ items yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Submissions */}
      {tab === "submissions" && (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white/80">{q.visitorName}</span>
                    <span className="text-xs text-white/30">{q.visitorEmail}</span>
                    {q.visitorPhone && <span className="text-xs text-white/20">{q.visitorPhone}</span>}
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed">{q.question}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border", statusColors[q.status] || statusColors.pending)}>
                    {q.status}
                  </span>
                  <button onClick={() => setDeleteTarget({ id: q.id, type: "question" })} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Type your answer..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleAnswer(q.id, "published")} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/10 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-all disabled:opacity-50">
                      <CheckCircle className="w-3.5 h-3.5" /> Publish
                    </button>
                    <button onClick={() => handleAnswer(q.id, "private")} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 text-white/50 text-sm font-medium hover:bg-white/10 transition-all disabled:opacity-50">
                      <Save className="w-3.5 h-3.5" /> Save Private
                    </button>
                    <button onClick={() => setAnsweringId(null)} className="px-4 py-2 rounded-xl border border-white/[0.06] text-sm text-white/40 hover:text-white/60 transition-all">Cancel</button>
                  </div>
                </div>
              ) : !q.adminReply && (
                <button
                  onClick={() => { setAnsweringId(q.id); setAnswerText(""); }}
                  className="flex items-center gap-1.5 text-xs text-neon-cyan/60 hover:text-neon-cyan transition-all mt-2"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Answer this question
                </button>
              )}
            </div>
          ))}
          {questions.length === 0 && (
            <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-12 text-center">
              <p className="text-sm text-white/30">No submissions yet.</p>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id, deleteTarget.type)}
        title="Delete Item?"
        description="This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
