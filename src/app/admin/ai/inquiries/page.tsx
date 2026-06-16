"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Mail, User, Trash2, Reply } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ConfirmModal } from "@/components/admin/shared/ConfirmModal";

interface Inquiry {
  id: number;
  name: string | null;
  email: string | null;
  message: string;
  category: string;
  status: string;
  response: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  responded: "bg-green-500/10 text-green-400 border-green-500/20",
  closed: "bg-white/5 text-white/30 border-white/10",
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  async function loadInquiries() {
    try {
      const res = await fetch("/api/admin/inquiries");
      const json = await res.json();
      if (json.success) setInquiries(json.data);
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadInquiries(); }, []);

  async function handleRespond(id: number) {
    if (!responseText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: responseText.trim(), status: "responded" }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Response saved");
        setRespondingId(null);
        setResponseText("");
        loadInquiries();
      } else {
        toast.error("Failed to save response");
      }
    } catch {
      toast.error("Failed to save response");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Inquiry deleted");
        setDeleteId(null);
        loadInquiries();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    }
  }

  const filtered = filter === "all" ? inquiries : inquiries.filter((i) => i.status === filter);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <PageHeader title="Inquiries" description="Visitor inquiries from AI chat">
        <div className="flex gap-2">
          {["all", "pending", "responded", "closed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                filter === f
                  ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                  : "text-white/40 hover:text-white/70 bg-white/[0.03] border border-transparent"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </PageHeader>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.02] p-12 text-center">
          <MessageSquare className="w-8 h-8 mx-auto text-white/20 mb-3" />
          <p className="text-sm text-white/40">No inquiries found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inquiry) => (
            <motion.div
              key={inquiry.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <div className="flex items-center gap-1.5 text-xs text-white/50">
                      <User className="w-3 h-3" />
                      <span>{inquiry.name || "Anonymous"}</span>
                    </div>
                    {inquiry.email && (
                      <div className="flex items-center gap-1.5 text-xs text-white/50">
                        <Mail className="w-3 h-3" />
                        <span>{inquiry.email}</span>
                      </div>
                    )}
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border", statusColors[inquiry.status] || statusColors.pending)}>
                      <span className={cn(
                        "w-1 h-1 rounded-full",
                        inquiry.status === "pending" ? "bg-amber-400" : inquiry.status === "responded" ? "bg-green-400" : "bg-white/20"
                      )} />
                      {inquiry.status}
                    </span>
                    <span className="text-[10px] text-white/20 bg-white/[0.03] px-2 py-0.5 rounded-full capitalize">{inquiry.category}</span>
                    <span className="text-[10px] text-white/20">{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">{inquiry.message}</p>
                  {inquiry.response && (
                    <div className="mt-3 p-3 rounded-xl bg-neon-cyan/[0.03] border border-neon-cyan/[0.06]">
                      <p className="text-xs text-neon-cyan/60 font-medium mb-1">Your Response:</p>
                      <p className="text-sm text-white/60">{inquiry.response}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setRespondingId(inquiry.id); setResponseText(inquiry.response || ""); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/20 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all"
                    title="Reply"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(inquiry.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {respondingId === inquiry.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 space-y-3"
                >
                  <Textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type your response..."
                    className="bg-white/5 border-white/10 text-white placeholder-white/30 min-h-[100px] text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => { setRespondingId(null); setResponseText(""); }}
                      className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 transition-colors"
                    >
                      Cancel
                    </button>
                    <Button
                      onClick={() => handleRespond(inquiry.id)}
                      disabled={saving || !responseText.trim()}
                      className="h-8 bg-gradient-to-r from-neon-orange to-neon-cyan text-black text-xs font-semibold"
                    >
                      {saving ? "Saving..." : "Send Response"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && handleDelete(deleteId)}
        title="Delete Inquiry"
        description="Are you sure you want to delete this inquiry? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
