import React, { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Copy,
  Check,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Filter,
  Play,
  Zap,
  Loader2,
  Lock,
} from "lucide-react";
import { SiClaudecode, SiCursor } from "react-icons/si";
import { RiOpenaiFill } from "react-icons/ri";
import { getPublishedTemplates, incrementLikes } from "../../lib/store";
import { canCopy, requiredPlanLabel } from "../../lib/access.js";
import UserProfileMenu from "../UserProfileMenu.jsx";
import LiquidMetalButton from "../ui/LiquidMetalButton.jsx";
import { OpticalButton } from "../ui/OpticalGlass.jsx";
import { DotmCircular5 } from "../ui/dotm-circular-5";
import TemplateCard from "./TemplateCard.jsx";

const categories = [
  "All",
  "Hero Section",
  "Landing Page",
  "UI Components",
  "Real Estate",
  "Food",
  "Health",
  "Agency",
  "Ecommerce",
  "Portfolio",
  "Saas",
];
const backgroundCategory = "Background Assets";
const types = ["All", "Free", "Premium", "Premium Plus"];
const sortOptions = ["Featured", "Popular", "Newest", "Liked"];

function formatLikes(value) {
  if (typeof value === "number" && value >= 1000) {
    return (value / 1000).toFixed(1) + "k";
  }
  return value + "";
}

function ClaudeCodeIcon() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-[4px] bg-[#d97757] text-white shrink-0 p-[2px] shadow-sm">
      <SiClaudecode className="w-2.5 h-2.5 text-white" />
    </span>
  );
}

function CodexIcon() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-[4px] bg-[#10a37f] text-white shrink-0 p-[2px] shadow-sm">
      <RiOpenaiFill className="w-2.5 h-2.5 text-white" />
    </span>
  );
}

function CursorIcon() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-[4px] bg-black border border-white/20 text-white shrink-0 p-[2px] shadow-sm">
      <SiCursor className="w-2.5 h-2.5 text-white" />
    </span>
  );
}

function AntigravityIcon() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-[4px] bg-[#0c0c0f] border border-white/20 shrink-0 p-[2px] shadow-sm">
      <svg
        className="w-2.5 h-2.5"
        viewBox="0 0 24 24"
        fill="none"
        style={{ flex: "none" }}
      >
        <defs>
          <linearGradient id="gallery-antigravity-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4285F4" />
            <stop offset="35%" stopColor="#9B72CB" />
            <stop offset="70%" stopColor="#D96570" />
            <stop offset="100%" stopColor="#FBBC04" />
          </linearGradient>
        </defs>
        <path
          fill="url(#gallery-antigravity-grad)"
          d="M21.751 22.607c1.34 1.005 3.35.335 1.508-1.508C17.73 15.74 18.904 1 12.037 1 5.17 1 6.342 15.74.815 21.1c-2.01 2.009.167 2.511 1.507 1.506 5.192-3.517 4.857-9.714 9.715-9.714 4.857 0 4.522 6.197 9.714 9.715z"
        />
      </svg>
    </span>
  );
}

function LovableIcon() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-[4px] bg-[#0c0c0f] border border-white/10 shrink-0 p-[2px] shadow-sm">
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none">
        <defs>
          <radialGradient
            id="gallery-lovable-gradient"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(-1 22.5 -30.5 -1.35 14 3)"
          >
            <stop offset="0.25" stopColor="#FE7B02" />
            <stop offset="0.43" stopColor="#FE4230" />
            <stop offset="0.55" stopColor="#FE529A" />
            <stop offset="0.65" stopColor="#DD67EE" />
            <stop offset="0.95" stopColor="#4B73FF" />
          </radialGradient>
        </defs>
        <path
          d="M7.082 0c3.91 0 7.081 3.179 7.081 7.1v2.7h2.357c3.91 0 7.082 3.178 7.082 7.1 0 3.923-3.17 7.1-7.082 7.1H0V7.1C0 3.18 3.17 0 7.082 0z"
          fill="url(#gallery-lovable-gradient)"
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

export default function Gallery({ onAdminAuth, onHome, session, userProfile, onAuthRequired, onGoUnlimited, pendingCopyTemplateId, onClearPendingCopy, onLogout }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [sortBy, setSortBy] = useState("Featured");
  const [copiedId, setCopiedId] = useState(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [liked, setLiked] = useState(new Set());
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const searchRef = useRef(null);
  const categoryScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDragged = useRef(false);

  const checkScroll = () => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [templates]);

  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const amount = direction === "left" ? -280 : 280;
      categoryScrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
      setTimeout(checkScroll, 350);
    }
  };

  const handleWheel = (e) => {
    if (categoryScrollRef.current && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      categoryScrollRef.current.scrollLeft += e.deltaY * 0.9;
      checkScroll();
    }
  };

  const handleMouseDown = (e) => {
    if (!categoryScrollRef.current) return;
    setIsDragging(true);
    hasDragged.current = false;
    dragStartX.current = e.pageX - categoryScrollRef.current.offsetLeft;
    dragScrollLeft.current = categoryScrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !categoryScrollRef.current) return;
    const x = e.pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 1.3;
    if (Math.abs(walk) > 5) {
      hasDragged.current = true;
    }
    categoryScrollRef.current.scrollLeft = dragScrollLeft.current - walk;
    checkScroll();
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    setTimeout(() => {
      hasDragged.current = false;
    }, 60);
  };

  const selectCategory = (c, e) => {
    if (hasDragged.current) return;
    setSelectedCategory(c);
    if (c !== backgroundCategory && e?.currentTarget && categoryScrollRef.current) {
      e.currentTarget.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
      setTimeout(checkScroll, 350);
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getPublishedTemplates().then((data) => {
      if (mounted) {
        setTemplates(data);
        setLoading(false);
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

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return templates
      .filter((t) => {
        const matchesSearch =
          !query ||
          t.title.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query);
        const isBackground = t.category?.toLowerCase() === backgroundCategory.toLowerCase();
        const matchesCategory =
          selectedCategory === backgroundCategory
            ? isBackground
            : selectedCategory === "All"
              ? !isBackground
              : t.category?.toLowerCase() === selectedCategory.toLowerCase();
        const matchesType = selectedType === "All" || t.type === selectedType;
        return matchesSearch && matchesCategory && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === "Popular" || sortBy === "Liked") return b.likes - a.likes;
        if (sortBy === "Newest") return new Date(b.created_at) - new Date(a.created_at);
        // Featured: custom position ascending
        return (a.position ?? 0) - (b.position ?? 0);
      });
  }, [templates, deferredSearch, selectedCategory, selectedType, sortBy]);

  const hasActiveFilters = selectedCategory !== "All" || selectedType !== "All" || search.trim() !== "";

  // Close type/sort menus on outside click or touch
  useEffect(() => {
    if (!showTypeMenu && !showSortMenu) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest("[data-dropdown-container]")) {
        setShowTypeMenu(false);
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [showTypeMenu, showSortMenu]);

  const handleCopy = useCallback(
    (template) => {
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
      const prompt =
        template.prompt ||
        `Build a premium ${template.title.toLowerCase()} website using React, Tailwind CSS, and Framer Motion. Use a dark aesthetic, glassmorphism cards, smooth scroll animations, and responsive layouts.`;
      navigator.clipboard.writeText(prompt).then(() => {
        setCopiedId(template.id);
        setTimeout(() => setCopiedId(null), 1800);
      });
    },
    [session, userProfile, onAuthRequired, onGoUnlimited]
  );

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

  const toggleLike = useCallback(
    async (e, id) => {
      e?.stopPropagation?.();
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
          prev.map((t) => (t.id === id ? { ...t, likes: t.likes + 1 } : t))
        );
      }
    },
    [liked]
  );

  const handlePreview = useCallback((template) => {
    setPreviewTemplate(template);
  }, []);

  const handleGoUnlimited = useCallback(() => {
    onGoUnlimited && onGoUnlimited();
  }, [onGoUnlimited]);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo */}
            <button onClick={onHome} className="text-xl font-semibold tracking-tight text-white flex items-center gap-1.5 shrink-0 cursor-pointer hover:text-white/80 transition-colors">
              <span>✦ Flowsites</span>
            </button>

            {/* Right: Search + Dropdowns + Auth */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop Search */}
              <div className="relative hidden md:block group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/60 transition-colors duration-300" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search prompts..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-48 lg:w-64 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none transition-all duration-300 bg-white/5 border border-white/10 border-t-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_2px_4px_rgba(0,0,0,0.3)] focus:bg-white/10 focus:border-white/20 focus:shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_2px_4px_rgba(0,0,0,0.4)] backdrop-blur-md"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-white/40 group-focus-within:text-white/80" />
                  </button>
                )}
              </div>

              {/* Desktop Type Dropdown */}
              <div className="relative hidden md:block" data-dropdown-container>
                <button
                  onClick={() => {
                    setShowTypeMenu(!showTypeMenu);
                    setShowSortMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/80 transition-all duration-300 bg-white/5 border border-white/10 border-t-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-white/10 hover:shadow-[0_6px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:-translate-y-0.5 backdrop-blur-md cursor-pointer"
                >
                  Type: {selectedType}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTypeMenu ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {showTypeMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-44 rounded-2xl overflow-hidden bg-[#121215]/95 backdrop-blur-xl border border-white/10 border-t-white/20 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] py-1.5 z-50"
                    >
                      {types.map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            setSelectedType(t);
                            setShowTypeMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors relative cursor-pointer ${
                            selectedType === t ? "text-white bg-white/10 font-semibold" : "text-white/60 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {selectedType === t && (
                            <motion.div layoutId="typeIndicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white rounded-r-full" />
                          )}
                          <span className={selectedType === t ? "font-medium" : ""}>{t}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Desktop Sort Dropdown */}
              <div className="relative hidden md:block" data-dropdown-container>
                <button
                  onClick={() => {
                    setShowSortMenu(!showSortMenu);
                    setShowTypeMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/80 transition-all duration-300 bg-white/5 border border-white/10 border-t-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-white/10 hover:shadow-[0_6px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:-translate-y-0.5 backdrop-blur-md cursor-pointer"
                >
                  {sortBy}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-44 rounded-2xl overflow-hidden bg-[#121215]/95 backdrop-blur-xl border border-white/10 border-t-white/20 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] py-1.5 z-50"
                    >
                      {sortOptions.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setSortBy(s);
                            setShowSortMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors relative cursor-pointer ${
                            sortBy === s ? "text-white bg-white/10 font-semibold" : "text-white/60 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {sortBy === s && (
                            <motion.div layoutId="sortIndicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white rounded-r-full" />
                          )}
                          <span className={sortBy === s ? "font-medium" : ""}>{s}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Go Premium Liquid Metal WebGL button (visible across all screens: mobile & desktop) */}
              <div className="h-[36px] min-w-[110px] sm:h-[42px] sm:min-w-[145px]">
                <LiquidMetalButton
                  onClick={() => onGoUnlimited && onGoUnlimited()}
                  labelStyle={{ fontSize: "12px", fontWeight: "600", letterSpacing: "0.02em" }}
                >
                  Go Premium
                </LiquidMetalButton>
              </div>

              {/* User profile menu or Login button */}
              {session ? (
                <UserProfileMenu
                  session={session}
                  userProfile={userProfile}
                  onUpgrade={() => onGoUnlimited && onGoUnlimited()}
                  onLogout={onLogout}
                />
              ) : (
                <button
                  onClick={onAdminAuth || onHome}
                  className="lg-pill px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium text-white/90 hover:text-white"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search + filters (Graceful Multi-row Design) */}
        <div className="md:hidden border-t border-white/5 px-4 py-2.5 flex flex-col gap-2.5 relative z-10 bg-gradient-to-b from-[#070707]/90 via-[#070707]/95 to-[#070707] backdrop-blur-xl">
          {/* Row 1: Mobile Search Input */}
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/70 transition-colors duration-200" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search prompts..."
              value={search}
              onChange={handleSearchChange}
              className="w-full rounded-full pl-10 pr-9 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none transition-all duration-200 bg-white/[0.04] border border-white/10 border-t-white/20 shadow-[0_2px_10px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)] focus:bg-white/[0.08] focus:border-white/25 backdrop-blur-md"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/40 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Row 2: Type Dropdown + Sort Dropdown + Reset */}
          <div className="flex items-center justify-between gap-2 pt-0.5 relative z-30">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Mobile Type Menu */}
              <div className="relative flex-1 min-w-0" data-dropdown-container>
                <button
                  type="button"
                  onClick={() => {
                    setShowTypeMenu(!showTypeMenu);
                    setShowSortMenu(false);
                  }}
                  className={`w-full flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 backdrop-blur-md border ${
                    selectedType !== "All"
                      ? "bg-white/15 border-white/30 text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)] font-semibold"
                      : "bg-white/[0.04] border-white/10 text-white/75 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  <span className="truncate">Type: {selectedType}</span>
                  <ChevronDown className={`w-3 h-3 shrink-0 text-white/40 transition-transform duration-200 ${showTypeMenu ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {showTypeMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-1.5 w-44 rounded-2xl overflow-hidden bg-[#121216] border border-white/12 border-t-white/30 shadow-[0_20px_45px_-6px_rgba(0,0,0,0.95),0_6px_18px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.15)] py-1.5 z-50"
                    >
                      {types.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setSelectedType(t);
                            setShowTypeMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                            selectedType === t
                              ? "text-white bg-white/10 font-semibold"
                              : "text-white/60 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <span>{t}</span>
                          {selectedType === t && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Sort Menu */}
              <div className="relative flex-1 min-w-0" data-dropdown-container>
                <button
                  type="button"
                  onClick={() => {
                    setShowSortMenu(!showSortMenu);
                    setShowTypeMenu(false);
                  }}
                  className={`w-full flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 backdrop-blur-md border ${
                    sortBy !== "Featured"
                      ? "bg-white/15 border-white/30 text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)] font-semibold"
                      : "bg-white/[0.04] border-white/10 text-white/75 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  <span className="truncate">{sortBy}</span>
                  <ChevronDown className={`w-3 h-3 shrink-0 text-white/40 transition-transform duration-200 ${showSortMenu ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-1.5 w-44 rounded-2xl overflow-hidden bg-[#121216] border border-white/12 border-t-white/30 shadow-[0_20px_45px_-6px_rgba(0,0,0,0.95),0_6px_18px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.15)] py-1.5 z-50"
                    >
                      {sortOptions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setSortBy(s);
                            setShowSortMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                            sortBy === s
                              ? "text-white bg-white/10 font-semibold"
                              : "text-white/60 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <span>{s}</span>
                          {sortBy === s && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Clear filters pill */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All");
                  setSelectedType("All");
                  setSearch("");
                }}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-white/60 hover:text-white bg-white/[0.04] border border-white/10 hover:bg-white/10 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Row 3: Horizontal Categories Scroll with Gradient Mask */}
          <div className="relative -mx-4 px-4 overflow-hidden z-10">
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#070707] to-transparent z-10 pointer-events-none" />
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
              {categories.map((c) => {
                const isActive = selectedCategory === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCategory(c)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-b from-white/20 to-white/5 border border-white/20 border-t-white/40 text-white shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-md"
                        : "bg-white/[0.03] border border-white/5 text-white/60 hover:text-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
              <div className="w-px h-4 bg-white/15 shrink-0 mx-0.5" />
              <button
                type="button"
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === backgroundCategory ? "All" : backgroundCategory
                  )
                }
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                  selectedCategory === backgroundCategory
                    ? "bg-gradient-to-b from-[#22232c] via-[#181921] to-[#101116] border border-white/30 border-t-white/60 text-white shadow-[0_6px_16px_-2px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-md"
                    : "bg-gradient-to-b from-[#18191f]/90 to-[#0e0f13]/95 border border-white/[0.12] border-t-white/20 text-white/80 hover:text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)]"
                }`}
              >
                <span>{backgroundCategory}</span>
              </button>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#070707] to-transparent z-10 pointer-events-none" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8 relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-white/30 mb-5 md:mb-8">
          <button onClick={onHome} className="hover:text-white/60 cursor-pointer transition-colors">Home</button>
          <span className="text-white/20">/</span>
          <span className="text-white/60">Browse</span>
        </div>

        {/* Desktop Category Chips Bar with Smooth Scroll & Standalone Background Assets Component */}
        <div className="hidden md:flex items-center gap-3 mb-10 w-full select-none">
          {/* Scrollable Categories Container with Navigation Arrows */}
          <div className="relative flex-1 min-w-0">
            {/* Left Arrow & Fade Mask */}
            <AnimatePresence>
              {canScrollLeft && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 top-0 bottom-0 z-20 flex items-center pr-10 bg-gradient-to-r from-[#070707] via-[#070707]/90 to-transparent pointer-events-none"
                >
                  <button
                    type="button"
                    onClick={() => scrollCategories("left")}
                    className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-white/90 hover:text-white shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    aria-label="Scroll categories left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrollable Container (Only Category Chips) */}
            <div
              ref={categoryScrollRef}
              onScroll={checkScroll}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className={`flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 scroll-smooth ${
                isDragging ? "cursor-grabbing select-none" : "cursor-grab"
              }`}
            >
              {categories.map((c) => {
                const isActive = selectedCategory === c;
                return (
                  <motion.button
                    key={c}
                    type="button"
                    onClick={(e) => selectCategory(c, e)}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ y: 0, scale: 0.98 }}
                    className={`group relative shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "text-white shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
                        : "text-white/60 hover:text-white/90 bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeCategoryPill"
                        className="absolute inset-0 bg-gradient-to-b from-white/20 to-white/5 rounded-full border border-white/20 border-t-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_rgba(0,0,0,0.5)] backdrop-blur-md"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{c}</span>
                  </motion.button>
                );
              })}

              {/* Clear Filters button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("All");
                    setSelectedType("All");
                  }}
                  className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium text-white/40 hover:text-white transition-colors ml-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Clear filters
                </button>
              )}
            </div>

            {/* Right Arrow & Fade Mask */}
            <AnimatePresence>
              {canScrollRight && (
                <motion.div
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-0 bottom-0 z-20 flex items-center pl-10 bg-gradient-to-l from-[#070707] via-[#070707]/90 to-transparent pointer-events-none"
                >
                  <button
                    type="button"
                    onClick={() => scrollCategories("right")}
                    className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-white/90 hover:text-white shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    aria-label="Scroll categories right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Separator Divider between Scroll Area and Background Assets Button */}
          <div className="w-px h-6 bg-white/10 shrink-0 mx-1" />

          {/* Standalone Background Assets Button (Tactile Luxury Liquid Glass with Multi-Layer Depth Shadows) */}
          {(() => {
            const isBgActive = selectedCategory === backgroundCategory;
            return (
              <motion.button
                type="button"
                onClick={() => {
                  setSelectedCategory(isBgActive ? "All" : backgroundCategory);
                }}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ y: 0, scale: 0.98 }}
                className={`group relative shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-xl ${
                  isBgActive
                    ? "text-white bg-gradient-to-b from-[#22232c] via-[#181921] to-[#101116] border border-white/30 border-t-white/60 shadow-[0_12px_28px_-4px_rgba(0,0,0,0.9),0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.45),inset_0_-1px_1px_rgba(0,0,0,0.6)]"
                    : "text-white/80 hover:text-white bg-gradient-to-b from-[#18191f]/95 via-[#121317]/95 to-[#0b0c0f]/98 border border-white/[0.12] border-t-white/25 shadow-[0_8px_20px_-3px_rgba(0,0,0,0.75),0_3px_8px_-2px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_1px_rgba(0,0,0,0.4)] hover:border-white/25 hover:border-t-white/40 hover:shadow-[0_12px_26px_-4px_rgba(0,0,0,0.85),0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.28)]"
                }`}
              >
                {/* Top specular highlight edge line */}
                <div className="absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                {/* Subtle active radial ambient background glow */}
                {isBgActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-b from-white/12 to-transparent pointer-events-none"
                  />
                )}

                <span className="relative z-10 tracking-tight font-medium">
                  {backgroundCategory}
                </span>
              </motion.button>
            );
          })()}
        </div>


        {/* Loading / Grid / Empty state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="flex items-center justify-center mb-5">
              <DotmCircular5
                size={44}
                dotSize={6}
                color="#ffffff"
                bloom={true}
                speed={1.6}
              />
            </div>
            <p className="text-sm font-medium text-white/60 tracking-wide animate-pulse">
              Loading templates...
            </p>
          </div>
        ) : (
          <>
            {/* Template Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
              {filtered.map((template, index) => {
                const accessible = !session || canCopy(template, userProfile);
                const badgeLabel = requiredPlanLabel(template.type);
                const isCopied = copiedId === template.id;
                const isBgAsset = template.category === backgroundCategory;
                const isLiked = liked.has(template.id);
                const displayLikes = isLiked ? template.likes + 1 : template.likes;

                return (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    index={index}
                    isLiked={isLiked}
                    isCopied={isCopied}
                    displayLikes={displayLikes}
                    accessible={accessible}
                    badgeLabel={badgeLabel}
                    isBgAsset={isBgAsset}
                    onLike={toggleLike}
                    onCopy={handleCopy}
                    onPreview={handlePreview}
                    onGoUnlimited={handleGoUnlimited}
                  />
                );
              })}
            </div>

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
          </>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-8 bg-black/85 backdrop-blur-2xl overflow-y-auto lg-scroll"
          >
            {/* Modal Container: Two Distinct Floating Rounded Cards Side-by-Side */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-6xl w-full flex flex-col lg:flex-row gap-5 lg:gap-6 items-stretch my-auto"
            >
              {/* Left Card — Media Preview Frame */}
              <div className="flex-1 min-w-0 rounded-[28px] bg-[#0c0c0f] border border-white/10 border-t-white/20 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col justify-center">
                <div className="relative w-full flex-1 flex items-center justify-center bg-[#070708] overflow-hidden min-h-[320px] sm:min-h-[460px] lg:min-h-[540px]">
                  {previewTemplate.video ? (
                    <video
                      src={previewTemplate.video}
                      className="w-full h-full max-h-[72vh] block object-contain"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={previewTemplate.image}
                      alt={previewTemplate.title}
                      className="w-full h-full max-h-[72vh] block object-contain"
                    />
                  )}
                </div>
              </div>

              {/* Right Card — Details & Actions */}
              <div className="w-full lg:w-[440px] shrink-0 rounded-[28px] bg-[#0c0c0f] border border-white/10 border-t-white/20 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.85)] p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  {/* Category Pill Badge & Close Button */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="px-2.5 py-1 rounded-[6px] bg-white/[0.08] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/70">
                      {previewTemplate.category || "LANDING PAGE"}
                    </span>

                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(null)}
                      className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer shrink-0"
                      aria-label="Close preview"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title */}
                  <h2 className="font-display text-2xl sm:text-3xl text-white font-bold tracking-tight mb-6 leading-snug">
                    {previewTemplate.title}
                  </h2>

                  {/* Main Action CTA: Liquid Metal for Premium / Locked, Optical Glass for Free / Unlocked */}
                  {(() => {
                    const isCopied = copiedId === previewTemplate.id;
                    const isBgAsset = previewTemplate.category === backgroundCategory;
                    const typeNormalized = (previewTemplate.type || "Free").toLowerCase();
                    const isPremium =
                      typeNormalized === "premium" ||
                      typeNormalized === "premium plus" ||
                      typeNormalized === "premium+";
                    const accessible = canCopy(previewTemplate, userProfile);
                    const showUpgrade = isPremium && !accessible;

                    if (showUpgrade) {
                      return (
                        <div className="w-full h-[52px] mb-7">
                          <LiquidMetalButton
                            onClick={() => {
                              setPreviewTemplate(null);
                              onGoUnlimited && onGoUnlimited();
                            }}
                            labelStyle={{
                              fontSize: "14px",
                              fontWeight: "600",
                              letterSpacing: "0.01em",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                            }}
                          >
                            <span>Upgrade to Premium</span>
                            <Sparkles className="w-4 h-4" />
                          </LiquidMetalButton>
                        </div>
                      );
                    }

                    return (
                      <div className="w-full h-[52px] mb-7">
                        <OpticalButton
                          onClick={() => handleCopy(previewTemplate)}
                          label={
                            isCopied
                              ? (isBgAsset ? "Copied Asset URL" : "Copied AI Prompt")
                              : (isBgAsset ? "Copy Asset URL" : "Copy AI Prompt")
                          }
                          icon={
                            isCopied ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-white" />
                            )
                          }
                          material="clear"
                          surface="dark"
                          fontSize="14px"
                          padding="12px 24px"
                          style={{ width: "100%", height: "52px", "--og-min-height": "52px" }}
                        />
                      </div>
                    );
                  })()}

                  {/* Section: How to use */}
                  <h3 className="text-base sm:text-lg font-bold text-white mb-4 tracking-tight">
                    How to use
                  </h3>

                  {/* Stepper Timeline */}
                  <div className="relative pl-11 space-y-6 mb-6">
                    {/* Vertical Connecting Line */}
                    <div className="absolute left-[15px] top-4 bottom-4 w-px bg-white/12" />

                    {/* Step 01 */}
                    <div className="relative">
                      <div className="absolute -left-11 top-0 w-8 h-8 rounded-full bg-[#141518] border border-white/15 text-[11px] font-semibold text-white/50 flex items-center justify-center shadow-sm z-10">
                        01
                      </div>
                      <p className="text-sm text-white/75 leading-snug pt-1">
                        Copy the AI Prompt with one click.
                      </p>
                    </div>

                    {/* Step 02 */}
                    <div className="relative">
                      <div className="absolute -left-11 top-0 w-8 h-8 rounded-full bg-[#141518] border border-white/15 text-[11px] font-semibold text-white/50 flex items-center justify-center shadow-sm z-10">
                        02
                      </div>
                      <div className="text-sm text-white/75 leading-relaxed pt-1">
                        Paste it into{" "}
                        <span className="inline-flex items-center gap-1 font-medium text-white">
                          <ClaudeCodeIcon /> Claude Code,
                        </span>{" "}
                        <span className="inline-flex items-center gap-1 font-medium text-white">
                          <CodexIcon /> Codex,
                        </span>{" "}
                        <span className="inline-flex items-center gap-1 font-medium text-white">
                          <CursorIcon /> Cursor,
                        </span>{" "}
                        <span className="inline-flex items-center gap-1 font-medium text-white">
                          <AntigravityIcon /> Antigravity,
                        </span>{" "}
                        <span className="inline-flex items-center gap-1 font-medium text-white">
                          <LovableIcon /> Lovable
                        </span>{" "}
                        or any AI coding tool.
                      </div>
                    </div>

                    {/* Step 03 */}
                    <div className="relative">
                      <div className="absolute -left-11 top-0 w-8 h-8 rounded-full bg-[#141518] border border-white/15 text-[11px] font-semibold text-white/50 flex items-center justify-center shadow-sm z-10">
                        03
                      </div>
                      <p className="text-sm text-white/55 leading-relaxed pt-1">
                        The agent pulls the zip, runs HTML or React on localhost, then applies your follow-up edits on top.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Likes */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-start">
                  {(() => {
                    const isTemplateLiked = liked.has(previewTemplate.id);
                    const displayPreviewLikes = isTemplateLiked
                      ? previewTemplate.likes + 1
                      : previewTemplate.likes;
                    return (
                      <button
                        type="button"
                        onClick={(e) => toggleLike(e, previewTemplate.id)}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.09] active:scale-[0.98] border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 transition-colors ${
                            isTemplateLiked ? "fill-[#f87171] text-[#f87171]" : "text-white/60"
                          }`}
                        />
                        <span className={isTemplateLiked ? "text-[#f87171]" : ""}>
                          {formatLikes(displayPreviewLikes)}
                        </span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
