import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Shuffle,
  Activity,
} from "lucide-react";
import AdminAnalytics from "./AdminAnalytics.jsx";
import {
  getTemplates,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  togglePublish,
  uploadImage,
  uploadVideo,
  saveTemplatesOrder,
  captureVideoFirstFrame,
} from "../../lib/store";
import {
  DEFAULT_CATEGORIES,
  parseCategories,
  serializeCategories,
} from "../../lib/categories";

const types = ["Free", "Premium", "Premium Plus"];

const emptyForm = {
  title: "",
  categories: ["Landing Page"],
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

function TemplateThumbnail({ template }) {
  const [imgError, setImgError] = useState(false);

  if (template.image && !imgError) {
    return (
      <img
        src={template.image}
        alt={template.title}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
    );
  }

  if (template.video) {
    return (
      <video
        src={template.video + "#t=0.001"}
        preload="metadata"
        muted
        playsInline
        className="w-full h-full object-cover pointer-events-none"
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center text-white/20 bg-white/5">
      <Video className="w-4 h-4" />
    </div>
  );
}

export default function Admin({ onBack, onViewGallery, onLogout }) {
  const [adminTab, setAdminTab] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "analytics" || params.get("user")) {
        return "analytics";
      }
    }
    return "templates";
  });
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
  const [capturingThumbnail, setCapturingThumbnail] = useState(false);
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

  const [randomizing, setRandomizing] = useState(false);

  async function handleRandomizeOrder() {
    if (templates.length <= 1) {
      showToast("Not enough templates to randomize");
      return;
    }
    setRandomizing(true);
    // Fisher-Yates shuffle algorithm on all templates
    const shuffled = [...templates];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const success = await saveTemplatesOrder(shuffled);
    setRandomizing(false);
    if (success) {
      setTemplates(shuffled);
      setOrderChanged(false);
      showToast("Template order randomized and saved!");
    } else {
      showToast("Failed to save randomized order");
    }
  }

  const [customCategory, setCustomCategory] = useState("");

  function handleOpenAdd() {
    setForm(emptyForm);
    setCustomCategory("");
    setEditingId(null);
    setShowForm(true);
    setPreviewMode(false);
  }

  function handleOpenEdit(template) {
    const initialCats = parseCategories(template.category);
    const validCats = initialCats.length > 0 ? initialCats : ["Landing Page"];
    setForm({
      title: template.title,
      categories: validCats,
      category: serializeCategories(validCats),
      type: template.type,
      image: template.image,
      video: template.video || "",
      prompt: template.prompt || "",
    });
    setCustomCategory("");
    setEditingId(template.id);
    setShowForm(true);
    setPreviewMode(false);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setCustomCategory("");
    setPreviewMode(false);
  }

  function handleToggleCategory(cat) {
    setForm((prev) => {
      const current = prev.categories || parseCategories(prev.category);
      const exists = current.includes(cat);
      const updated = exists ? current.filter((c) => c !== cat) : [...current, cat];
      return {
        ...prev,
        categories: updated,
        category: serializeCategories(updated),
      };
    });
  }

  function handleAddCustomCategory() {
    const trimmed = customCategory.trim();
    if (!trimmed) return;
    setForm((prev) => {
      const current = prev.categories || parseCategories(prev.category);
      if (current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      const updated = [...current, trimmed];
      return {
        ...prev,
        categories: updated,
        category: serializeCategories(updated),
      };
    });
    setCustomCategory("");
  }

  function handleRemoveCategory(cat) {
    setForm((prev) => {
      const current = prev.categories || parseCategories(prev.category);
      const updated = current.filter((c) => c !== cat);
      return {
        ...prev,
        categories: updated,
        category: serializeCategories(updated),
      };
    });
  }

  async function handleCaptureFromVideo(sourceVideo) {
    const videoTarget = sourceVideo || form.video;
    if (!videoTarget) {
      showToast("Please provide a video first");
      return null;
    }
    setCapturingThumbnail(true);
    try {
      const frameBlob = await captureVideoFirstFrame(videoTarget);
      if (frameBlob) {
        const thumbFile = new File([frameBlob], `thumb-${Date.now()}.jpg`, { type: "image/jpeg" });
        const url = await uploadImage(thumbFile);
        if (url) {
          setForm((f) => ({ ...f, image: url }));
          showToast("Thumbnail captured from first frame!");
          return url;
        } else {
          showToast("Failed to upload captured thumbnail");
        }
      } else {
        showToast("Could not capture frame from video");
      }
    } catch (err) {
      showToast("Error capturing frame: " + err.message);
    } finally {
      setCapturingThumbnail(false);
    }
    return null;
  }

  async function handleSave() {
    let imageToSave = form.image.trim();

    // Auto-generate thumbnail from first frame if video exists but image is empty
    if (!imageToSave && form.video.trim()) {
      setSaving(true);
      try {
        const frameBlob = await captureVideoFirstFrame(form.video.trim());
        if (frameBlob) {
          const thumbFile = new File([frameBlob], `thumb-${Date.now()}.jpg`, { type: "image/jpeg" });
          const url = await uploadImage(thumbFile);
          if (url) {
            imageToSave = url;
          }
        }
      } catch (err) {
        console.warn("Auto thumbnail capture before save failed:", err);
      }
    }

    const activeCats =
      form.categories && form.categories.length > 0
        ? form.categories
        : parseCategories(form.category);
    const finalCategories = activeCats.length > 0 ? activeCats : ["Landing Page"];
    const serializedCat = serializeCategories(finalCategories);

    const finalForm = {
      ...form,
      title: form.title.trim() || "Untitled",
      category: serializedCat,
      image: imageToSave,
      video: form.video.trim() || "",
      prompt: form.prompt.trim() || "",
    };

    setSaving(true);
    let result;
    if (editingId) {
      result = await updateTemplate(editingId, finalForm);
      showToast(result ? "Template updated successfully" : "Failed to update template");
    } else {
      result = await addTemplate(finalForm);
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

    // Auto-capture thumbnail from first frame if image is empty
    let generatedThumbUrl = null;
    if (!form.image) {
      setCapturingThumbnail(true);
      try {
        const frameBlob = await captureVideoFirstFrame(file);
        if (frameBlob) {
          const thumbFile = new File([frameBlob], `thumb-${Date.now()}.jpg`, { type: "image/jpeg" });
          generatedThumbUrl = await uploadImage(thumbFile);
        }
      } catch (err) {
        console.warn("Could not capture video thumbnail:", err);
      } finally {
        setCapturingThumbnail(false);
      }
    }

    const url = await uploadVideo(file);
    setUploadingVideo(false);
    if (url) {
      setForm((f) => ({
        ...f,
        video: url,
        image: f.image || generatedThumbUrl || "",
      }));
      showToast(generatedThumbUrl ? "Video & 1st frame thumbnail uploaded!" : "Video uploaded to storage");
    } else {
      showToast("Failed to upload video");
    }
  }

  const filtered = templates.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const titleMatch = (t.title || "").toLowerCase().includes(q);
    const categoryMatch = (t.category || "").toLowerCase().includes(q);
    const multiCatMatch = parseCategories(t.category).some((c) =>
      c.toLowerCase().includes(q)
    );
    return titleMatch || categoryMatch || multiCatMatch;
  });

  const totalCategoriesCount = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES);
    templates.forEach((t) => {
      parseCategories(t.category).forEach((c) => set.add(c));
    });
    return set.size;
  }, [templates]);

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
                <span className="ml-2 text-xs font-medium text-white/30 uppercase tracking-wider hidden sm:inline">Admin</span>
              </div>

              {/* Tab Switcher: Templates vs Analytics */}
              <div className="flex items-center p-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md ml-1 sm:ml-2">
                <button
                  type="button"
                  onClick={() => setAdminTab("templates")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    adminTab === "templates"
                      ? "bg-white/20 text-white shadow-sm border border-white/10"
                      : "text-white/40 hover:text-white/80"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Templates ({templates.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab("analytics")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    adminTab === "analytics"
                      ? "bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30 font-semibold"
                      : "text-white/40 hover:text-white/80"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Analytics</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                </button>
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

              {adminTab === "templates" && (
                <>
                  <button
                    onClick={handleRandomizeOrder}
                    disabled={randomizing || loading || templates.length <= 1}
                    className="lg-pill flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white transition-all hover:border-white/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Shuffle all templates into a randomized order"
                  >
                    {randomizing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#a78bfa]" />
                    ) : (
                      <Shuffle className="w-4 h-4 text-[#a78bfa]" />
                    )}
                    <span className="hidden sm:inline">Randomize Order</span>
                    <span className="sm:hidden">Randomize</span>
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
                </>
              )}

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {adminTab === "analytics" ? (
          <AdminAnalytics />
        ) : (
          <>
            {/* Stats — Tactile Liquid Glass Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Templates", value: templates.length, color: "text-white", glow: "via-white/30" },
                { label: "Published", value: publishedCount, color: "text-[#34d399]", glow: "via-emerald-400/35" },
                { label: "Drafts", value: draftCount, color: "text-[#fbbf24]", glow: "via-amber-400/35" },
                { label: "Categories", value: totalCategoriesCount, color: "text-[#a78bfa]", glow: "via-purple-400/35" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="group relative rounded-[22px] p-5 bg-gradient-to-b from-[#141419]/90 via-[#0e0e13]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-white/20 transition-all duration-300 overflow-hidden"
                >
                  <div className={`absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent ${stat.glow} to-transparent pointer-events-none`} />
                  <p className="text-[11.5px] font-medium tracking-wide uppercase text-white/40 mb-2">{stat.label}</p>
                  <p className={`font-display text-3xl sm:text-4xl font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Search & Actions Bar (Gallery Style) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input
                  type="text"
                  placeholder="Search templates by title or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-full pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-white/35 bg-white/[0.04] border border-white/10 border-t-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] focus:outline-none focus:border-white/30 transition-all backdrop-blur-md"
                />
              </div>

              <button
                onClick={handleRandomizeOrder}
                disabled={randomizing || loading || templates.length <= 1}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white/85 hover:text-white bg-gradient-to-b from-white/15 to-white/5 hover:from-white/25 hover:to-white/10 border border-white/15 border-t-white/30 shadow-[0_6px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                title="Shuffle all templates into a randomized order"
              >
                {randomizing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#a78bfa]" />
                ) : (
                  <Shuffle className="w-4 h-4 text-[#a78bfa]" />
                )}
                <span>Randomize Order</span>
              </button>
            </div>

            {/* Templates Table — Liquid Glass (Gallery Container Style) */}
            <div className="relative rounded-[26px] bg-gradient-to-b from-[#121217]/95 via-[#0d0d12]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_20px_48px_-12px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl overflow-hidden">
              <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
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
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#0d0d0f] border border-white/8 shrink-0 flex items-center justify-center relative shadow-sm">
                    <TemplateThumbnail template={template} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm truncate">{template.title}</p>
                    <p className="text-xs text-white/30 truncate">
                      {template.video ? "Has video preview" : "No video"}
                    </p>
                  </div>
                </div>

                {/* Category */}
                <div className="col-span-2 flex flex-wrap items-center gap-1.5">
                  {(() => {
                    const cats = parseCategories(template.category);
                    if (cats.length === 0) {
                      return <span className="text-xs text-white/30">None</span>;
                    }
                    const visible = cats.slice(0, 2);
                    const remaining = cats.length - visible.length;
                    return (
                      <>
                        {visible.map((cat) => (
                          <span
                            key={cat}
                            className="text-xs px-2 py-0.5 rounded-md bg-white/[0.06] text-white/75 border border-white/10 truncate max-w-[120px]"
                            title={cat}
                          >
                            {cat}
                          </span>
                        ))}
                        {remaining > 0 && (
                          <span
                            className="text-[11px] px-1.5 py-0.5 rounded-md bg-[#a78bfa]/15 text-[#c4b5fd] border border-[#a78bfa]/25 font-medium cursor-help"
                            title={cats.slice(2).join(", ")}
                          >
                            +{remaining}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Type */}
                <div className="col-span-1">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      template.type === "Premium Plus"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        : template.type === "Premium"
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
          </>
        )}
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
                    <div className="lg-prompt-box rounded-xl overflow-hidden mb-4 relative bg-[#0d0d0f] flex items-center justify-center">
                      {form.video ? (
                        <video
                          src={form.video}
                          className="w-full h-auto max-h-[50vh] block object-contain"
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
                    <div className="flex flex-wrap items-center gap-1.5 mb-4">
                      {parseCategories(form.categories || form.category).map((cat) => (
                        <span
                          key={cat}
                          className="lg-badge text-xs font-semibold px-2.5 py-0.5 rounded-full text-white/70"
                        >
                          {cat}
                        </span>
                      ))}
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          form.type === "Premium Plus"
                            ? "bg-amber-500/15 text-amber-400"
                            : form.type === "Premium"
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

                    {/* Categories Multi-Select */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-white/40 uppercase tracking-wider">
                          Categories <span className="text-white/20 normal-case">(Select multiple or add custom)</span>
                        </label>
                        <span className="text-xs text-white/40">
                          {(form.categories || parseCategories(form.category)).length} selected
                        </span>
                      </div>

                      {/* Active Categories Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 min-h-[44px] p-2.5 rounded-xl bg-white/[0.03] border border-white/8">
                        {(form.categories || parseCategories(form.category)).length === 0 ? (
                          <span className="text-xs text-white/30 italic px-1">
                            No categories selected. Choose presets below or type a custom one.
                          </span>
                        ) : (
                          (form.categories || parseCategories(form.category)).map((cat) => (
                            <span
                              key={cat}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#a78bfa]/15 text-[#c4b5fd] border border-[#a78bfa]/30 transition-all shadow-sm"
                            >
                              <span>{cat}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCategory(cat)}
                                className="hover:text-white hover:bg-white/10 rounded p-0.5 transition-colors cursor-pointer"
                                title={`Remove ${cat}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      {/* Preset Category Chips */}
                      <div>
                        <p className="text-[11px] text-white/30 uppercase tracking-wider mb-2 font-medium">Quick Presets</p>
                        <div className="flex flex-wrap gap-1.5">
                          {DEFAULT_CATEGORIES.map((cat) => {
                            const isSelected = (form.categories || parseCategories(form.category)).includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => handleToggleCategory(cat)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-white text-[#070707] font-semibold shadow-md"
                                    : "bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/5"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 text-[#070707]" />}
                                <span>{cat}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Category Input */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomCategory();
                            }
                          }}
                          placeholder="Add custom category..."
                          className="lg-input flex-1 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomCategory}
                          disabled={!customCategory.trim()}
                          className="lg-pill flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-white/80 hover:text-white border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>

                    {/* Type */}
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

                    {/* Thumbnail Image */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-medium text-white/30 uppercase tracking-wider">
                          Thumbnail Image
                        </label>
                        {form.video && (
                          <button
                            type="button"
                            onClick={() => handleCaptureFromVideo()}
                            disabled={capturingThumbnail}
                            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {capturingThumbnail ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            {capturingThumbnail ? "Capturing..." : "Extract from video"}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#0d0d0f] border border-white/8 shrink-0 relative flex items-center justify-center">
                          {form.image ? (
                            <img
                              src={form.image}
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                            />
                          ) : form.video ? (
                            <video
                              src={form.video + "#t=0.001"}
                              preload="metadata"
                              muted
                              playsInline
                              className="w-full h-full object-cover pointer-events-none"
                            />
                          ) : (
                            <div className="text-white/20 text-xs">No image</div>
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingImage}
                              className="lg-pill flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                              {uploadingImage ? "Uploading..." : "Upload from device"}
                            </button>
                            {form.video && (
                              <button
                                type="button"
                                onClick={() => handleCaptureFromVideo()}
                                disabled={capturingThumbnail}
                                className="lg-pill flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 hover:text-amber-300 border-amber-500/20 bg-amber-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {capturingThumbnail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                {capturingThumbnail ? "Capturing 1st frame..." : "Use video 1st frame"}
                              </button>
                            )}
                          </div>
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
                          <div className="lg-prompt-box rounded-xl overflow-hidden max-w-sm">
                            <video
                              src={form.video}
                              className="w-full h-auto block object-contain"
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
