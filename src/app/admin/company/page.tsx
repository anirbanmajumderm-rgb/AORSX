"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Save, RefreshCw, Building2, Link as LinkIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminCompanyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFounder, setUploadingFounder] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState({
    name: "", tagline: "", description: "", aboutText: "",
    vision: "", mission: "", founderName: "", founderRole: "",
    founderBio: "", founderImage: "",
    email: "", phone: "", address: "",
    linkedin: "", twitter: "", github: "",
    logo: "",
  });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch("/api/company");
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setForm({
          name: d.name || "", tagline: d.tagline || "",
          description: d.description || "", aboutText: d.aboutText || "",
          vision: d.vision || "", mission: d.mission || "",
          founderName: d.founderName || "", founderRole: d.founderRole || "",
          founderBio: d.founderBio || "", founderImage: d.founderImage || "",
          email: d.email || "", phone: d.phone || "", address: d.address || "",
          linkedin: d.linkedin || "", twitter: d.twitter || "", github: d.github || "",
          logo: d.logo || "",
        });
      }
    } catch { toast.error("Failed to load company info"); }
    finally { setLoading(false); }
  }

  async function handlePhotoUpload(field: "founderImage" | "logo", file: File) {
    const setUploading = field === "founderImage" ? setUploadingFounder : setUploadingLogo;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.success) {
        setForm(prev => ({ ...prev, [field]: json.data.url }));
        toast.success("Image uploaded");
      } else {
        toast.error(json.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/company", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) toast.success("Company info updated");
      else toast.error(json.error || "Failed to save");
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  }

  const Field = ({ label, key, type, placeholder, rows }: { label: string; key: string; type?: string; placeholder?: string; rows?: number }) => {
    const value = (form as any)[key] ?? "";
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-white/50">{label}</label>
        {rows ? (
          <textarea value={value} onChange={(e) => setForm({ ...form, [key]: e.target.value })} rows={rows}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 resize-none" placeholder={placeholder}
          />
        ) : (
          <input type={type || "text"} value={value} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" placeholder={placeholder}
          />
        )}
      </div>
    );
  };

  if (loading) return <div className="p-6 animate-pulse space-y-6"><div className="h-8 w-48 bg-white/5 rounded-lg" /><div className="h-96 bg-white/5 rounded-2xl" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Company</h1>
          <p className="text-sm text-white/40 mt-1">Edit company profile and brand information</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold hover:opacity-90 transition-all text-sm disabled:opacity-50">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.04] mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <Building2 size={16} className="text-neon-cyan" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold">Brand Information</h3>
              <p className="text-xs text-white/30">Company name, tagline, and description</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Field({ label: "Company Name", key: "name", placeholder: "Your Company" })}
            {Field({ label: "Tagline", key: "tagline", placeholder: "AI SaaS Agency" })}
            {Field({ label: "Description", key: "description", rows: 3, placeholder: "Company description" })}
            {Field({ label: "About Text", key: "aboutText", rows: 4, placeholder: "About page text" })}
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.04] mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <Building2 size={16} className="text-neon-orange" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold">Vision & Mission</h3>
              <p className="text-xs text-white/30">Your company goals and principles</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Field({ label: "Vision", key: "vision", rows: 3, placeholder: "Our vision..." })}
            {Field({ label: "Mission", key: "mission", rows: 3, placeholder: "Our mission..." })}
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.04] mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <Building2 size={16} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold">Founder Info</h3>
              <p className="text-xs text-white/30">Founder details and bio</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Field({ label: "Founder Name", key: "founderName", placeholder: "John Doe" })}
            {Field({ label: "Founder Role", key: "founderRole", placeholder: "CEO & Founder" })}
            {Field({ label: "Founder Bio", key: "founderBio", rows: 3, placeholder: "About the founder..." })}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Founder Photo</label>
              <div className="flex items-center gap-3">
                {form.founderImage && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/[0.06] shrink-0 bg-white/[0.03]">
                    <Image src={form.founderImage} alt="Founder" width={56} height={56} className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/50 hover:text-white/70 hover:border-neon-cyan/30 cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  {uploadingFounder ? "Uploading..." : "Upload Photo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={uploadingFounder}
                    onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handlePhotoUpload("founderImage", f); }}
                  />
                </label>
                {form.founderImage && (
                  <button onClick={() => setForm(p => ({ ...p, founderImage: "" }))} className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.04] mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <Building2 size={16} className="text-green-400" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold">Contact & Social</h3>
              <p className="text-xs text-white/30">Email, phone, address, and social links</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Field({ label: "Email", key: "email", type: "email", placeholder: "hello@company.com" })}
            {Field({ label: "Phone", key: "phone", placeholder: "+1 (555) 123-4567" })}
            {Field({ label: "Address", key: "address", placeholder: "123 Main St, City" })}
            <div />
            {Field({ label: "LinkedIn URL", key: "linkedin", placeholder: "https://linkedin.com/..." })}
            {Field({ label: "Twitter URL", key: "twitter", placeholder: "https://twitter.com/..." })}
            {Field({ label: "GitHub URL", key: "github", placeholder: "https://github.com/..." })}
            <div />
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.04] mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <LinkIcon size={16} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold">Logo URL</h3>
              <p className="text-xs text-white/30">Direct URL to your brand logo</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50">Logo URL</label>
            <input type="text" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })}
              className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" placeholder="https://..."
            />
          </div>
          <div className="flex items-center gap-3 mt-3">
            {form.logo && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] inline-block">
                <Image src={form.logo} alt="Logo preview" width={48} height={48} className="h-10 w-auto object-contain" />
              </div>
            )}
            <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/50 hover:text-white/70 hover:border-neon-cyan/30 cursor-pointer transition-all">
              <Upload className="w-4 h-4" />
              {uploadingLogo ? "Uploading..." : "Upload Logo"}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" disabled={uploadingLogo}
                onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handlePhotoUpload("logo", f); }}
              />
            </label>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
