"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, CheckCircle, XCircle, Mail, RefreshCw, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/admin/shared/ConfirmModal";

interface Review {
  id: number;
  projectId: number;
  reviewerName: string;
  reviewerEmail: string | null;
  rating: number;
  reviewText: string | null;
  isApproved: boolean;
  isSpam: boolean;
  createdAt: string;
  project: { title: string; slug: string } | null;
}

export default function AdminReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/reviews?admin=true");
      const json = await res.json();
      if (json.success) setItems(json.data);
      else toast.error(json.error || "Failed to load");
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleAction(review: Review, updates: Record<string, any>) {
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
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
      const res = await fetch(`/api/reviews/${deleteTarget.id}`, { method: "DELETE" });
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
          <h1 className="text-2xl font-bold font-heading">Reviews</h1>
          <p className="text-sm text-white/40 mt-1">Moderate client reviews and testimonials</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/60 hover:text-white/80 transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-green-500/[0.04] border border-green-500/10 p-4 text-center">
          <p className="font-heading text-2xl font-bold text-green-400">{items.filter(r => r.isApproved && !r.isSpam).length}</p>
          <p className="text-xs text-white/30 mt-1">Approved</p>
        </div>
        <div className="rounded-xl bg-amber-500/[0.04] border border-amber-500/10 p-4 text-center">
          <p className="font-heading text-2xl font-bold text-amber-400">{items.filter(r => !r.isApproved && !r.isSpam).length}</p>
          <p className="text-xs text-white/30 mt-1">Pending</p>
        </div>
        <div className="rounded-xl bg-red-500/[0.04] border border-red-500/10 p-4 text-center">
          <p className="font-heading text-2xl font-bold text-red-400">{items.filter(r => r.isSpam).length}</p>
          <p className="text-xs text-white/30 mt-1">Spam</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-12 text-center">
            <p className="text-sm text-white/30">No reviews yet.</p>
          </div>
        )}
        {items.map((item) => (
          <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={cn("rounded-2xl border overflow-hidden transition-all", item.isSpam ? "bg-red-500/[0.02] border-red-500/10" : item.isApproved ? "bg-white/[0.02] border-white/[0.04]" : "bg-amber-500/[0.02] border-amber-500/10")}
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-semibold text-white/90">{item.reviewerName}</span>
                    {item.reviewerEmail && <span className="text-xs text-white/30">{item.reviewerEmail}</span>}
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} className={cn(i < item.rating ? "text-amber-400 fill-amber-400" : "text-white/10")} />
                      ))}
                    </div>
                  </div>
                  {item.project && <p className="text-xs text-white/30 mb-1">Project: {item.project.title}</p>}
                  {item.reviewText && <p className="text-sm text-white/50 leading-relaxed">{item.reviewText}</p>}
                  <p className="text-[10px] text-white/20 mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", item.isSpam ? "bg-red-500/10 text-red-400 border-red-500/20" : item.isApproved ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20")}>
                    {item.isSpam ? "Spam" : item.isApproved ? "Approved" : "Pending"}
                  </span>
                  {!item.isApproved && !item.isSpam && (
                    <button onClick={() => handleAction(item, { isApproved: true })} className="p-2 rounded-lg text-green-400/50 hover:text-green-400 hover:bg-green-500/5 transition-all" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                  )}
                  {!item.isSpam && (
                    <button onClick={() => handleAction(item, { isSpam: true })} className="p-2 rounded-lg text-red-400/30 hover:text-red-400 hover:bg-red-500/5 transition-all" title="Mark as spam"><XCircle className="w-4 h-4" /></button>
                  )}
                  {item.isApproved && (
                    <button onClick={() => handleAction(item, { isApproved: false })} className="p-2 rounded-lg text-amber-400/50 hover:text-amber-400 hover:bg-amber-500/5 transition-all" title="Unapprove"><XCircle className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => setDeleteTarget(item)} className="p-2 rounded-lg text-red-400/30 hover:text-red-400 hover:bg-red-500/5 transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <ConfirmModal open={!!deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} title="Delete Review" description={`Delete review by "${deleteTarget?.reviewerName}"?`} confirmText="Delete" variant="danger" />
    </div>
  );
}
