import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Copy,
  Check,
  Search,
  ChevronDown,
  X,
  Sparkles,
  Filter,
  Play,
  Zap,
  Crown,
} from "lucide-react";
import { getPublishedTemplates, incrementLikes } from "../../lib/store";
import { canCopy, requiredPlanLabel } from "../../lib/access.js";
import UserProfileMenu from "../UserProfileMenu.jsx";

const categories = ["All", "Hero Section", "Landing Page", "Portfolio", "Dashboard", "Agency", "Ecommerce"];
const backgroundCategory = "Background Assets";
const types = ["All", "Free", "Premium", "Premium Plus"];
const sortOptions = ["Featured", "Popular", "Newest", "Liked"];

function formatLikes(value) {
  if (typeof value === "number" && value >= 1000) {
    return (value / 1000).toFixed(1) + "k";
  }
  return value + "";
}

export default function Gallery({ onAdminAuth, onHome, session, userProfile, onAuthRequired, onGoUnlimited, pendingCopyTemplateId, onClearPendingCopy, onLogout }) {
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [sortBy, setSortBy] = useState("Featured");
  const [copiedId, setCopiedId] = useState(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [liked, setLiked] = useState(new Set());
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [loadedIds, setLoadedIds] = useState(new Set());
  const searchRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    getPublishedTemplates().then((data) => {
      if (mounted) {
        setTemplates(data);
      }
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSearchChange(e) {
    const value = e.target.value;
    if (value.trim().toLowerCase() === "/admin") {
      onAdminAuth();
      setSearch("");
      return;
    }
    setSearch(value);
  }

  const filtered = templates
    .filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      const isBackground = t.category === backgroundCategory;
      const matchesCategory = selectedCategory === backgroundCategory
        ? isBackground
        : selectedCategory === "All"
          ? !isBackground
          : t.category === selectedCategory;
      const matchesType = selectedType === "All" || t.type === selectedType;
      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "Popular") return b.likes - a.likes;
      if (sortBy === "Liked") return b.likes - a.likes;
      if (sortBy === "Newest") return new Date(b.created_at) - new Date(a.created_at);
      // Featured: custom position ascending
      return (a.position ?? 0) - (b.position ?? 0);
    });

  const hasActiveFilters = selectedCategory !== "All" || selectedType !== "All";

  function handleCopy(template) {
    // Gate behind authentication first
    if (!session) {
      onAuthRequired && onAuthRequired(template.id);
      return;
    }
    // Gate behind subscription plan
    if (!canCopy(template, userProfile)) {
      onGoUnlimited && onGoUnlimited();
      return;
    }
    const prompt = template.prompt || `Build a premium ${template.title.toLowerCase()} website using React, Tailwind CSS, and Framer Motion. Use a dark aesthetic, glassmorphism cards, smooth scroll animations, and responsive layouts.`;
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(template.id);
      setTimeout(() => setCopiedId(null), 1800);
    });
  }

  // After successful auth, auto-copy the deferred template
  useEffect(() => {
    if (!pendingCopyTemplateId || !session || templates.length === 0) return;
    const template = templates.find((t) => t.id === pendingCopyTemplateId);
    if (template) {
      handleCopy(template);
      onClearPendingCopy && onClearPendingCopy();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCopyTemplateId, session, templates]);

  function handleMediaLoaded(id) {
    setLoadedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  async function toggleLike(e, id) {
    e.stopPropagation();
    const isLiked = liked.has(id);
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (!isLiked) {
      await incrementLikes(id);
      setTemplates((prev) =>
        prev.map((t) => t.id === id ? { ...t, likes: t.likes + 1 } : t)
      );
    }
  }

  function renderTemplateCard(template, isHorizontal = false) {
    const isLiked = liked.has(template.id);
    const displayLikes = isLiked ? template.likes + 1 : template.likes;
    return (
      <motion.div
        key={template.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`lg-card group relative rounded-2xl overflow-hidden ${
          isHorizontal ? "shrink-0 w-[280px] sm:w-[320px] snap-start" : ""
        }`}
      >
        {/* Image Area — responsive to original aspect ratio */}
        <div className={`relative overflow-hidden bg-[#0d0d0f] isolate ${loadedIds.has(template.id) ? "" : "min-h-[200px]"}`}>
          {template.video ? (
            <video
              src={template.video}
              className="w-full aspect-video object-cover block transition-opacity duration-500 group-hover:opacity-90"
              loading="lazy"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              onLoadedData={() => handleMediaLoaded(template.id)}
            />
          ) : (
            <img
              src={template.image}
              alt={template.title}
              className="w-full h-auto block transition-opacity duration-500 group-hover:opacity-90"
              onLoad={() => handleMediaLoaded(template.id)}
              loading="lazy"
            />
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

          {/* Like badge — hidden by default, shown on hover */}
          <button
            onClick={(e) => toggleLike(e, template.id)}
            className="lg-badge absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                isLiked ? "fill-[#f87171] text-[#f87171]" : "text-white/70"
              }`}
            />
            <span className={isLiked ? "text-[#f87171]" : "text-white/80"}>
              {formatLikes(displayLikes)}
            </span>
          </button>

          {/* Hover preview button — Premium Liquid Glass */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => setPreviewTemplate(template)}
              className="relative flex items-center gap-2 px-6 py-3 rounded-full bg-white/15 backdrop-blur-md border border-white/30 border-t-white/50 text-white text-sm font-medium shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.4),inset_0_-1px_0_0_rgba(255,255,255,0.1)] overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              {template.video ? (
                <>
                  <Play className="w-4 h-4 fill-white/90 text-white/90" /> Play Preview
                </>
              ) : (
                "Preview"
              )}
            </button>
          </div>
        </div>

        {/* Card Footer */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-lg text-white leading-tight mb-1 truncate">
                {template.title}
              </h3>
              <p className="text-xs text-white/40 font-medium">{template.category}</p>
            </div>
            {/* Access-aware Copy button */}
            {(() => {
              const accessible = !session || canCopy(template, userProfile);
              const badgeLabel = requiredPlanLabel(template.type);
              if (copiedId === template.id) {
                return (
                  <button className="lg-pill shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#34d399]">
                    <Check className="w-3.5 h-3.5" /> Copied
                  </button>
                );
              }
              if (!accessible && badgeLabel) {
                const isPremiumPlus = template.type === "Premium Plus";
                return (
                  <button
                    onClick={() => onGoUnlimited && onGoUnlimited()}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      isPremiumPlus
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                        : "bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20"
                    }`}
                  >
                    {isPremiumPlus ? <Crown className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                    {badgeLabel}
                  </button>
                );
              }
              return (
                <button
                  onClick={() => handleCopy(template)}
                  className="lg-pill shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              );
            })()}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className="min-h-screen relative text-[#f4f4f5] font-body selection:bg-white/20 overflow-x-hidden"
      style={{ background: "#070707" }}
    >
      {/* Ambient glow orbs */}
      <div className="lg-glow" style={{ top: "-10%", left: "20%", width: "500px", height: "500px", background: "rgba(167,139,250,0.06)" }} />
      <div className="lg-glow" style={{ top: "40%", right: "10%", width: "400px", height: "400px", background: "rgba(52,211,153,0.04)" }} />
      <div className="lg-glow" style={{ bottom: "0%", left: "30%", width: "450px", height: "450px", background: "rgba(251,191,36,0.03)" }} />

      {/* Top Navigation — Liquid Glass Header */}
      <header className="lg-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button onClick={onHome} className="text-xl font-semibold tracking-tight text-white flex items-center gap-1.5 justify-self-start cursor-pointer hover:text-white/80 transition-colors">
              <span>✦ Flowsites</span>
            </button>

            {/* Center: spacer */}

            {/* Right: Search + Dropdowns */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search prompts..."
                  value={search}
                  onChange={handleSearchChange}
                  className="lg-input w-48 lg:w-64 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-white/40" />
                  </button>
                )}
              </div>

              {/* Type Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowTypeMenu(!showTypeMenu);
                    setShowSortMenu(false);
                  }}
                  className="lg-pill flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/80 transition-colors"
                >
                  Type
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTypeMenu ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {showTypeMenu && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="lg-dropdown absolute right-0 mt-2 w-40 rounded-xl overflow-hidden"
                    >
                      {types.map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            setSelectedType(t);
                            setShowTypeMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            selectedType === t ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSortMenu(!showSortMenu);
                    setShowTypeMenu(false);
                  }}
                  className="lg-pill flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/80 transition-colors"
                >
                  {sortBy}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="lg-dropdown absolute right-0 mt-2 w-40 rounded-xl overflow-hidden"
                    >
                      {sortOptions.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setSortBy(s);
                            setShowSortMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            sortBy === s ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Go Unlimited button */}
              <button
                onClick={() => onGoUnlimited && onGoUnlimited()}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-violet-500/20 to-amber-500/20 border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-all"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                Go Unlimited
              </button>

              {/* User profile menu */}
              {session && (
                <UserProfileMenu
                  session={session}
                  userProfile={userProfile}
                  onUpgrade={() => onGoUnlimited && onGoUnlimited()}
                  onLogout={onLogout}
                />
              )}
            </div>
          </div>
        </div>

        {/* Mobile search + filters */}
        <div className="md:hidden border-t border-white/5 px-4 py-3 flex flex-col gap-3 relative z-10">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search prompts..."
              value={search}
              onChange={handleSearchChange}
              className="lg-input w-full rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === c ? "lg-pill-active" : "lg-pill text-white/60"
                }`}
              >
                {c}
              </button>
            ))}
            <div className="w-px h-5 bg-white/15 shrink-0" />
            <button
              onClick={() => setSelectedCategory(backgroundCategory)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === backgroundCategory ? "lg-pill-active" : "lg-pill text-white/60"
              }`}
            >
              {backgroundCategory}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/30 mb-8">
          <button onClick={onHome} className="hover:text-white/60 cursor-pointer transition-colors">Home</button>
          <span className="text-white/20">/</span>
          <span className="text-white/60">Browse</span>
        </div>

        {/* Desktop Category Chips */}
        <div className="hidden md:flex items-center gap-2 mb-10 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === c ? "lg-pill-active" : "lg-pill text-white/60 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
          <div className="w-px h-6 bg-white/15" />
          <button
            onClick={() => setSelectedCategory(backgroundCategory)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === backgroundCategory ? "lg-pill-active" : "lg-pill text-white/60 hover:text-white"
            }`}
          >
            {backgroundCategory}
          </button>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSelectedType("All");
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium text-white/40 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-white/40">
            Showing <span className="text-white font-medium">{filtered.length}</span> prompts
          </p>
        </div>

        {/* Template Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-5"
        >
          <AnimatePresence>
            {filtered.map((template) => renderTemplateCard(template, false))}
          </AnimatePresence>
        </motion.div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="lg-glass w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
              <Filter className="w-7 h-7 text-white/30" />
            </div>
            <h3 className="font-display text-2xl text-white mb-2">No prompts found</h3>
            <p className="text-sm text-white/40 max-w-sm">
              Try adjusting your filters or search term to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
                setSelectedType("All");
              }}
              className="mt-6 px-5 py-2.5 rounded-full bg-white text-[#070707] text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>

      {/* Preview Modal — Liquid Glass */}
      <AnimatePresence>
        {previewTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewTemplate(null)}
            className="lg-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="lg-modal relative rounded-[2rem] w-full max-w-5xl max-h-[90vh] overflow-y-auto lg-scroll flex flex-col md:flex-row bg-[#121215]/95 border border-white/10 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.5)]"
            >
              {/* Close Button — Top Right of Entire Modal */}
              <button
                onClick={() => setPreviewTemplate(null)}
                className="absolute top-6 right-6 z-50 flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-b from-white/25 to-white/10 border border-white/30 border-t-white/50 text-white shadow-[0_8px_24px_-4px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.4)] hover:from-white/35 hover:to-white/15 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Right Sidebar — Template Info */}
              <div className="w-full md:w-[320px] shrink-0 p-6 md:p-8 border-b md:border-b-0 md:border-l border-white/8 flex flex-col order-2 md:order-2">
                <div className="flex items-center justify-between md:justify-start mb-6 pr-8">
                  <h3 className="font-display text-2xl md:text-3xl text-white leading-tight">{previewTemplate.title}</h3>
                </div>

                <p className="text-sm text-white/40 mb-2">{previewTemplate.category}</p>

                {(() => {
                  const isTemplateLiked = liked.has(previewTemplate.id);
                  const displayPreviewLikes = isTemplateLiked ? previewTemplate.likes + 1 : previewTemplate.likes;
                  return (
                    <button
                      onClick={(e) => toggleLike(e, previewTemplate.id)}
                      className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors cursor-pointer group w-fit"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors group-hover:scale-110 duration-200 ${
                          isTemplateLiked ? "fill-[#f87171] text-[#f87171]" : "text-white/60"
                        }`}
                      />
                      <span className={isTemplateLiked ? "text-[#f87171] font-medium" : ""}>
                        {formatLikes(displayPreviewLikes)} likes
                      </span>
                    </button>
                  );
                })()}

                {/* Access-aware Copy button — preview modal */}
                {(() => {
                  const accessible = !session || canCopy(previewTemplate, userProfile);
                  const badgeLabel = requiredPlanLabel(previewTemplate.type);
                  if (copiedId === previewTemplate.id) {
                    return (
                      <button className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white text-[#070707] text-sm font-semibold transition-colors shadow-[0_8px_24px_-8px_rgba(255,255,255,0.2)]">
                        <Check className="w-4 h-4 text-[#34d399]" /> Copied
                      </button>
                    );
                  }
                  if (!accessible && badgeLabel) {
                    const isPremiumPlus = previewTemplate.type === "Premium Plus";
                    return (
                      <button
                        onClick={() => { setPreviewTemplate(null); onGoUnlimited && onGoUnlimited(); }}
                        className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-full text-sm font-semibold border transition-colors ${
                          isPremiumPlus
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                            : "bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20"
                        }`}
                      >
                        {isPremiumPlus ? <Crown className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                        Unlock {badgeLabel}
                      </button>
                    );
                  }
                  return (
                    <button
                      onClick={() => handleCopy(previewTemplate)}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white text-[#070707] text-sm font-semibold hover:bg-white/90 transition-colors shadow-[0_8px_24px_-8px_rgba(255,255,255,0.2)]"
                    >
                      <Copy className="w-4 h-4" /> Copy full prompt
                    </button>
                  );
                })()}

              </div>

              {/* Left Content — Preview */}
              <div className={`flex-1 relative bg-[#070707] overflow-hidden order-1 md:order-1 ${previewTemplate.video ? "aspect-video" : "min-h-[240px] md:min-h-0"}`}>

                {previewTemplate.video ? (
                  <video
                    src={previewTemplate.video}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={previewTemplate.image}
                    alt={previewTemplate.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
