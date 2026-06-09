"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, Download, Copy, ImageUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/admin/shared/ConfirmModal";

interface UploadedFile {
  id: number;
  originalName: string;
  storedName: string;
  filePath: string;
  fileType: string | null;
  fileSize: number | null;
  uploadType: string;
  createdAt: string;
}

export default function AdminMediaPage() {
  const [items, setItems] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UploadedFile | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/upload");
      const json = await res.json();
      if (json.success) setItems(json.data);
      else toast.error(json.error || "Failed to load");
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function formatSize(bytes: number | null): string {
    if (!bytes) return "—";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit++; }
    return `${size.toFixed(1)} ${units[unit]}`;
  }

  function getFileType(fileType: string | null): string {
    if (!fileType) return "unknown";
    if (fileType.startsWith("image")) return "image";
    if (fileType === "application/pdf") return "pdf";
    if (fileType === "application/zip") return "archive";
    return "other";
  }

  async function handleUpload(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) { toast.success("Uploaded"); load(); }
      else toast.error(json.error || "Failed to upload");
    } catch { toast.error("Network error"); }
    setUploading(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/upload/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) { toast.success("Deleted"); setDeleteTarget(null); load(); }
      else toast.error(json.error || "Failed to delete");
    } catch { toast.error("Failed to delete"); }
  }

  function copyUrl(item: UploadedFile) {
    navigator.clipboard.writeText(item.filePath).then(() => toast.success("URL copied")).catch(() => toast.error("Failed to copy"));
  }

  const imageItems = items.filter((f) => getFileType(f.fileType) === "image");
  const otherItems = items.filter((f) => getFileType(f.fileType) !== "image");

  if (loading) return <div className="p-6 animate-pulse space-y-6"><div className="h-8 w-48 bg-white/5 rounded-lg" /><div className="h-96 bg-white/5 rounded-2xl" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Media Library</h1>
          <p className="text-sm text-white/40 mt-1">{items.length} file{items.length !== 1 ? "s" : ""} uploaded</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="relative inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold text-sm hover:opacity-90 transition-all">
            <ImageUp className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload File"}
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} disabled={uploading} />
          </label>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/60 hover:text-white/80 transition-all"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Images Grid */}
      {imageItems.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Images ({imageItems.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {imageItems.map((item) => (
              <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="group relative rounded-xl border border-white/[0.04] bg-white/[0.02] overflow-hidden"
              >
                <div className="aspect-square relative">
                  <img src={item.filePath} alt={item.originalName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => copyUrl(item)} className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"><Copy className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteTarget(item)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] text-white/60 truncate">{item.originalName}</p>
                  <p className="text-[10px] text-white/30">{formatSize(item.fileSize)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Other Files */}
      {otherItems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Documents ({otherItems.length})</h3>
          <div className="space-y-2">
            {otherItems.map((item) => (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{item.originalName}</p>
                    <p className="text-xs text-white/30 mt-0.5">{formatSize(item.fileSize)} &middot; {item.fileType || "unknown"}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a href={item.filePath} download className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.03] transition-all"><Download className="w-4 h-4" /></a>
                    <button onClick={() => copyUrl(item)} className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.03] transition-all" title="Copy URL"><Copy className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteTarget(item)} className="p-2 rounded-lg text-red-400/30 hover:text-red-400 hover:bg-red-500/5 transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-12 text-center">
          <ImageUp size={40} className="text-white/10 mx-auto mb-4" />
          <p className="text-sm text-white/30">No files uploaded yet.</p>
        </div>
      )}

      <ConfirmModal open={!!deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} title="Delete File" description={`Delete "${deleteTarget?.originalName}"?`} confirmText="Delete" variant="danger" />
    </div>
  );
}
