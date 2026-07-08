import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Upload,
  Video,
  FileText,
  Search,
  Sparkles,
  ArrowLeft,
  Check,
  Loader2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Layers,
} from "lucide-react";
import {
  getTemplates,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  togglePublish,
  uploadImage,
  uploadVideo,
  saveTemplatesOrder,
} from "../../lib/store";

const categories = [
  "Hero Section",
  "Landing Page",
  "Portfolio",
  "Dashboard",
  "Agency",
  "Ecommerce",
  "Background Assets",
];
const types = ["Free", "Premium"];

const emptyForm = {
  title: "",
  category: "Landing Page",
  type: "Free",
  image: "",
  video: "",
  prompt: "",
};

function formatLikes(value) {
  if (typeof value === "number" && value >= 1000) {
    return (value / 1000).toFixed(1) + "k";
  }
  return value + "";
}

export default function Admin({ onBack, onViewGallery, onLogout }) {
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getTemplates().then((data) => {
      if (mounted) {
        setTemplates(data);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const [draggingIndex, setDraggingIndex] = useState(null);
  const [orderChanged, setOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  function handleRowDragStart(index) {
    setDraggingIndex(index);
  }

  function handleRowDrop(targetIndex) {
    if (draggingIndex === null || draggingIndex === targetIndex) return;
    setTemplates((prev) => {
      const next = [...prev];
      const [moved] = next.splice(draggingIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDraggingIndex(null);
    setOrderChanged(true);
  }

  async function handleSaveOrder() {
    setSavingOrder(true);
    const success = await saveTemplatesOrder(templates);
    setSavingOrder(false);
    if (success) {
      showToast("Templates order saved successfully!");
      setOrderChanged(false);
      const fresh = await getTemplates();
      setTemplates(fresh);
    } else {
      showToast("Failed to save templates order");
    }
  }

  function handleOpenAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setPreviewMode(false);
  }

  function handleOpenEdit(template) {
    setForm({
      title: template.title,
      category: template.category,
      type: template.type,
      image: template.image,
      video: template.video || "",
      prompt: template.prompt || "",
    });
    setEditingId(template.id);
    setShowForm(true);
    setPreviewMode(false);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setPreviewMode(false);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      showToast("Title is required");
      return;
    }
    if (!form.image.trim()) {
      showToast("Thumbnail image URL is required");
      return;
    }

    setSaving(true);
    let result;
    if (editingId) {
      result = await updateTemplate(editingId, form);
      showToast(result ? "Template updated successfully" : "Failed to update template");
    } else {
      result = await addTemplate(form);
      showToast(result ? "Template created successfully" : "Failed to create template");
    }
    setSaving(false);
    if (result) {
      const updated = await getTemplates();
      setTemplates(updated);
      handleCloseForm();
    }
  }

  async function handleDelete(id) {
    await deleteTemplate(id);
    const updated = await getTemplates();
    setTemplates(updated);
    showToast("Template deleted");
  }

  async function handleTogglePublish(id) {
    await togglePublish(id);
    const updated = await getTemplates();
    setTemplates(updated);
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const url = await uploadImage(file);
    setUploadingImage(false);
    if (url) {
      setForm((f) => ({ ...f, image: url }));
      showToast("Image uploaded to storage");
    } else {
      showToast("Failed to upload image");
    }
  }

  async function handleVideoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingVideo(true);
    const url = await uploadVideo(file);
    setUploadingVideo(false);
    if (url) {
      setForm((f) => ({ ...f, video: url }));
      showToast("Video uploaded to storage");
    } else {
      showToast("Failed to upload video");
    }
  }

  const filtered = templates.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  const publishedCount = templates.filter((t) => t.published).length;
  const draftCount = templates.length - publishedCount;

  return (
    <div
      className="min-h-screen relative text-[#f4f4f5] font-body selection:bg-white/20 overflow-x-hidden"
      style={{ background: "#070707" }}
    >
      {/* Ambient glow orbs */}
      <div className="lg-glow" style={{ top: "-5%", left: "15%", width: "450px", height: "450px", background: "rgba(167,139,250,0.05)" }} />
      <div className="lg-glow" style={{ top: "30%", right: "5%", width: "380px", height: "380px", background: "rgba(52,211,153,0.03)" }} />
      <div className="lg-glow" style={{ bottom: "5%", left: "40%", width: "400px", height: "400px", background: "rgba(251,191,36,0.025)" }} />

      {/* Header — Liquid Glass */}
      <header className="lg-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="lg-pill flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="text-xl font-semibold tracking-tight text-white flex items-center gap-1.5 justify-self-start">
                <span>✦ Flowsites</span>
                <span className="ml-2 text-xs font-medium text-white/30 uppercase tracking-wider">Admin</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onViewGallery}
                className="lg-pill hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Gallery
              </button>
              {orderChanged && (
                <button
                  onClick={handleSaveOrder}
                  disabled={savingOrder}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-[#34d399] text-[#070707] hover:bg-[#34d399]/90 disabled:opacity-50 transition-all shadow-[0_8px_20px_-6px_rgba(52,211,153,0.3)] animate-pulse"
                >
                  {savingOrder ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save Order</span>
                </button>
              )}
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white text-[#070707] hover:bg-white/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Template</span>
                <span className="sm:hidden">New</span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="lg-pill flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-[#f87171]/70 hover:text-[#f87171] transition-colors"
                  title="Sign out"
                >
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Stats — Liquid Glass Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Templates", value: templates.length, color: "text-white" },
            { label: "Published", value: publishedCount, color: "text-[#34d399]" },
            { label: "Drafts", value: draftCount, color: "text-[#fbbf24]" },
            { label: "Categories", value: categories.length, color: "text-[#a78bfa]" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="lg-glass rounded-2xl p-5"
            >
              <p className="text-xs text-white/30 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={`font-display text-3xl ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search — Liquid Glass Input */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="lg-input w-full rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Templates Table — Liquid Glass */}
        <div className="lg-glass rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-white/30" />
            </div>
          ) : (
            <>
          {/* Desktop table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-xs font-medium text-white/30 uppercase tracking-wider">
            <div className="col-span-1"></div>
            <div className="col-span-3">Template</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-1">Likes</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/5">
            {filtered.map((template, index) => (
              <div
                key={template.id}
                draggable={!search}
                onDragStart={() => handleRowDragStart(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleRowDrop(index)}
                className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/5 transition-colors ${
                  !search ? "cursor-grab active:cursor-grabbing" : ""
                }`}
              >
                {/* Drag handle */}
                <div className="col-span-1 flex items-center justify-start text-white/20">
                  {!search && <GripVertical className="w-4 h-4 cursor-grab hover:text-white/40 transition-colors" />}
                </div>

                {/* Template info */}
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#0d0d0f] shrink-0">
                    {template.image && (
                      <img
                        src={template.image}
                        alt={template.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm truncate">{template.title}</p>
                    <p className="text-xs text-white/30 truncate">
                      {template.video ? "Has video preview" : "No video"}
                    </p>
                  </div>
                </div>

                {/* Category */}
                <div className="col-span-2">
                  <span className="text-sm text-white/60">{template.category}</span>
                </div>

                {/* Type */}
                <div className="col-span-1">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      template.type === "Premium"
                        ? "bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/20"
                        : "bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/20"
                    }`}
                  >
                    {template.type}
                  </span>
                </div>

                {/* Likes */}
                <div className="col-span-1">
                  <span className="text-sm text-white/50">{formatLikes(template.likes)}</span>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <button
                    onClick={() => handleTogglePublish(template.id)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                      template.published
                        ? "bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/20"
                        : "lg-pill text-white/40"
                    }`}
                  >
                    {template.published ? (
                      <>
                        <Eye className="w-3 h-3" /> Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" /> Draft
                      </>
                    )}
                  </button>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(template)}
                    className="lg-pill p-2 rounded-lg text-white/50 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${template.title}"?`)) handleDelete(template.id);
                    }}
                    className="p-2 rounded-lg bg-[#f87171]/10 border border-[#f87171]/20 text-[#f87171] hover:bg-[#f87171]/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-white/30 text-sm mb-4">No templates found</p>
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#070707] text-sm font-medium hover:bg-white/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create your first template
              </button>
            </div>
          )}
            </>
          )}
        </div>

      </main>

      {/* Form Modal — Liquid Glass */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-8"
            onClick={handleCloseForm}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="lg-modal rounded-2xl w-full max-w-3xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <h2 className="font-display text-2xl text-white">
                  {editingId ? "Edit Template" : "New Template"}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      previewMode
                        ? "lg-pill-active"
                        : "lg-pill text-white/50"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {previewMode ? "Edit Mode" : "Preview"}
                  </button>
                  <button
                    onClick={handleCloseForm}
                    className="lg-pill p-2 rounded-lg text-white/50 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="max-h-[calc(90vh-140px)] overflow-y-auto lg-scroll">
                {previewMode ? (
                  /* Preview Mode */
                  <div className="p-6">
                    <div className={`lg-prompt-box rounded-xl overflow-hidden mb-4 relative bg-[#0d0d0f] flex items-center justify-center ${form.video ? "w-full aspect-video" : ""}`}>
                      {form.video ? (
                        <video
                          src={form.video}
                          className="w-full h-full object-cover block"
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      ) : form.image ? (
                        <img src={form.image} alt={form.title} className="w-full h-auto block max-h-[40vh] object-contain" />
                      ) : (
                        <div className="flex items-center justify-center h-32 text-white/20 text-sm">
                          No preview available
                        </div>
                      )}
                    </div>
                    <h3 className="font-display text-3xl text-white mb-2">{form.title || "Untitled"}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="lg-badge text-xs font-semibold px-2 py-0.5 rounded-full text-white/60">
                        {form.category}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          form.type === "Premium"
                            ? "bg-[#fbbf24]/15 text-[#fbbf24]"
                            : "bg-[#34d399]/15 text-[#34d399]"
                        }`}
                      >
                        {form.type}
                      </span>
                    </div>
                    <div className="lg-prompt-box rounded-xl p-5">
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Prompt</p>
                      <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                        {form.prompt || "No prompt written yet..."}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Edit Mode */
                  <div className="p-6 space-y-5">
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-medium text-white/30 uppercase tracking-wider mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. 3D Portfolio"
                        className="lg-input w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Category + Type */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-white/30 uppercase tracking-wider mb-2">
                          Category
                        </label>
                        <select
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          className="lg-input w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                        >
                          {categories.map((c) => (
                            <option key={c} value={c} className="bg-[#121215]">
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/30 uppercase tracking-wider mb-2">
                          Type
                        </label>
                        <select
                          value={form.type}
                          onChange={(e) => setForm({ ...form, type: e.target.value })}
                          className="lg-input w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                        >
                          {types.map((t) => (
                            <option key={t} value={t} className="bg-[#121215]">
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Thumbnail Image */}
                    <div>
                      <label className="block text-xs font-medium text-white/30 uppercase tracking-wider mb-2">
                        Thumbnail Image
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#0d0d0f] border border-white/8 shrink-0">
                          {form.image && (
                            <img
                              src={form.image}
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={form.image}
                            onChange={(e) => setForm({ ...form, image: e.target.value })}
                            placeholder="Paste image URL or upload..."
                            className="lg-input w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="lg-pill flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white transition-colors disabled:opacity-50"
                          >
                            {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                            {uploadingImage ? "Uploading..." : "Upload from device"}
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Video Preview */}
                    <div>
                      <label className="block text-xs font-medium text-white/30 uppercase tracking-wider mb-2">
                        Video Preview <span className="text-white/20 normal-case">(optional)</span>
                      </label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={form.video}
                          onChange={(e) => setForm({ ...form, video: e.target.value })}
                          placeholder="Paste video URL (mp4, webm)..."
                          className="lg-input w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors"
                        />
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "video/*";
                              input.onchange = handleVideoUpload;
                              input.click();
                            }}
                            disabled={uploadingVideo}
                            className="lg-pill flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white transition-colors disabled:opacity-50"
                          >
                            {uploadingVideo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                            {uploadingVideo ? "Uploading..." : "Upload video from device"}
                          </button>
                          {form.video && (
                            <span className="text-xs text-[#34d399] flex items-center gap-1">
                              <Check className="w-3 h-3" /> Video attached
                            </span>
                          )}
                        </div>
                        {form.video && (
                          <div className="lg-prompt-box rounded-xl overflow-hidden aspect-video max-w-sm">
                            <video
                              src={form.video}
                              className="w-full h-full object-cover"
                              controls
                              muted
                              playsInline
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Prompt */}
                    <div>
                      <label className="block text-xs font-medium text-white/30 uppercase tracking-wider mb-2">
                        Prompt
                      </label>
                      <textarea
                        value={form.prompt}
                        onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                        placeholder="Write the AI prompt that users will copy to generate this website..."
                        rows={6}
                        className="lg-input w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors resize-y leading-relaxed"
                      />
                      <p className="text-xs text-white/20 mt-1">
                        This is what users copy and paste into their AI coding assistant.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              {!previewMode && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/8 bg-[#070707]/40">
                  <div className="flex items-center gap-2 text-xs text-white/30">
                    <FileText className="w-3.5 h-3.5" />
                    {editingId ? "Editing existing template" : "Creating new template"}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCloseForm}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-white text-[#070707] hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {editingId ? "Save Changes" : "Create Template"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="lg-elevated fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-white text-sm font-medium flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-[#34d399]" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
