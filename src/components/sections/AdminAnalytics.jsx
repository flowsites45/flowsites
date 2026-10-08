import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Users,
  Copy,
  Play,
  Search,
  Zap,
  TrendingUp,
  Monitor,
  Smartphone,
  Globe,
  Clock,
  Download,
  RefreshCw,
  Check,
  ChevronDown,
  Filter,
  Eye,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Layers,
  Flame,
  MousePointer,
  Compass,
  X,
  UserCheck,
  User,
  ArrowRight,
  Calendar,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Laptop,
  FileText,
} from "lucide-react";
import { getAnalyticsEvents, formatDuration } from "../../lib/analytics";

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

function formatRelativeTime(isoString) {
  if (!isoString) return "just now";
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 15) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatExactDateTime(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export default function AdminAnalytics() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d"); // "24h", "7d", "30d", "all"
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "users", "searches", "live"
  const [eventFilter, setEventFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [activeBarHover, setActiveBarHover] = useState(null);

  // User detail journey state
  const [selectedUserKey, setSelectedUserKey] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("user") || null;
    }
    return null;
  });
  const [userModalFilter, setUserModalFilter] = useState("all");
  const [timelineSearchTerm, setTimelineSearchTerm] = useState("");
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all"); // "all", "registered", "anonymous"

  // User dossier action handlers
  const handleSelectUser = useCallback((userKey) => {
    setSelectedUserKey(userKey);
    setUserModalFilter("all");
    setTimelineSearchTerm("");
    if (typeof window !== "undefined") {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("tab", "analytics");
      newUrl.searchParams.set("user", userKey);
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const handleCloseUser = useCallback(() => {
    setSelectedUserKey(null);
    setTimelineSearchTerm("");
    if (typeof window !== "undefined") {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("user");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const handleCopyUserId = useCallback((textToCopy) => {
    if (!textToCopy) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedUserId(true);
      setTimeout(() => setCopiedUserId(false), 2000);
    }
  }, []);

  const handleOpenUserNewTab = useCallback((userKey) => {
    if (!userKey || typeof window === "undefined") return;
    const url = `/admin?tab=analytics&user=${encodeURIComponent(userKey)}`;
    window.open(url, "_blank");
  }, []);

  const handleExportUserJson = useCallback((user) => {
    if (!user || typeof window === "undefined") return;
    const cleanUser = {
      ...user,
      pathsVisited: Array.from(user.pathsVisited || []),
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanUser, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `user-dossier-${(user.displayName || "user").replace(/[^a-z0-9]/gi, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, []);

  // Load analytics events
  const loadData = useCallback(async () => {
    setRefreshing(true);
    const data = await getAnalyticsEvents(1500);
    setEvents(data);
    setLoading(false);
    setTimeout(() => setRefreshing(false), 300);
  }, []);

  useEffect(() => {
    loadData();
    // Auto-poll for new live events every 15 seconds
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Close user dossier on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && selectedUserKey) {
        handleCloseUser();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUserKey, handleCloseUser]);

  // Filter events by timeframe
  const filteredEvents = useMemo(() => {
    if (timeRange === "all") return events;
    const now = Date.now();
    const cutoff =
      timeRange === "24h"
        ? now - 24 * 60 * 60 * 1000
        : timeRange === "7d"
        ? now - 7 * 24 * 60 * 60 * 1000
        : now - 30 * 24 * 60 * 60 * 1000;

    return events.filter((e) => new Date(e.created_at).getTime() >= cutoff);
  }, [events, timeRange]);

  // Key performance aggregates
  const stats = useMemo(() => {
    const pageViews = filteredEvents.filter((e) => e.event_type === "page_view").length;
    const promptCopies = filteredEvents.filter((e) => e.event_type === "prompt_copy").length;
    const videoPreviews = filteredEvents.filter((e) => e.event_type === "video_preview").length;
    const searches = filteredEvents.filter((e) => e.event_type === "search_query").length;
    const upgradeClicks = filteredEvents.filter(
      (e) => e.event_type === "upgrade_click" || e.event_type === "pricing_view"
    ).length;

    const uniqueVisitors = new Set(filteredEvents.map((e) => e.user_id || e.session_id)).size;
    const uniqueSessions = new Set(filteredEvents.map((e) => e.session_id).filter(Boolean)).size;

    const copyRate = uniqueVisitors > 0 ? ((promptCopies / uniqueVisitors) * 100).toFixed(1) : "0.0";
    const previewRate = uniqueVisitors > 0 ? ((videoPreviews / uniqueVisitors) * 100).toFixed(1) : "0.0";

    // Accurate Time on Page calculation
    const timeEvents = filteredEvents.filter(
      (e) => e.event_type === "time_on_page" || (e.metadata && typeof e.metadata.duration_seconds === "number" && e.event_type !== "preview_duration")
    );
    const totalTimeSeconds = timeEvents.reduce(
      (acc, e) => acc + (Number(e.metadata?.duration_seconds) || 0),
      0
    );
    const avgTimeSeconds = timeEvents.length > 0 ? Math.round(totalTimeSeconds / timeEvents.length) : 0;
    const avgTimeFormatted = formatDuration(avgTimeSeconds);

    return {
      pageViews,
      promptCopies,
      videoPreviews,
      searches,
      upgradeClicks,
      uniqueVisitors,
      uniqueSessions,
      copyRate,
      previewRate,
      avgTimeSeconds,
      avgTimeFormatted,
      timeEventsCount: timeEvents.length,
    };
  }, [filteredEvents]);

  // Top Copied Templates
  const topCopied = useMemo(() => {
    const map = new Map();
    filteredEvents
      .filter((e) => e.event_type === "prompt_copy")
      .forEach((e) => {
        const title = e.metadata?.template_title || e.event_name.replace('Copied "', "").replace('"', "") || "Unknown";
        const cat = e.metadata?.template_category || "Template";
        const existing = map.get(title) || { title, category: cat, copies: 0, previews: 0 };
        existing.copies += 1;
        map.set(title, existing);
      });

    filteredEvents
      .filter((e) => e.event_type === "video_preview")
      .forEach((e) => {
        const title = e.metadata?.template_title || e.event_name.replace('Previewed "', "").replace('"', "");
        if (map.has(title)) {
          map.get(title).previews += 1;
        }
      });

    return Array.from(map.values()).sort((a, b) => b.copies - a.copies).slice(0, 10);
  }, [filteredEvents]);

  // Top Video Previews
  const topPreviews = useMemo(() => {
    const map = new Map();
    filteredEvents
      .filter((e) => e.event_type === "video_preview")
      .forEach((e) => {
        const title = e.metadata?.template_title || e.event_name.replace('Previewed "', "").replace('"', "") || "Unknown";
        const cat = e.metadata?.template_category || "Template";
        const existing = map.get(title) || { title, category: cat, count: 0 };
        existing.count += 1;
        map.set(title, existing);
      });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredEvents]);

  // Top Searches Intelligence
  const topSearches = useMemo(() => {
    const map = new Map();
    filteredEvents
      .filter((e) => e.event_type === "search_query")
      .forEach((e) => {
        const rawQ = e.metadata?.query || e.event_name.replace('Searched "', "").replace('"', "");
        const q = (rawQ || "").trim().toLowerCase();
        if (!q || q.length < 2) return;
        const existing = map.get(q) || { query: q, count: 0, lastSearched: e.created_at, zeroResults: 0 };
        existing.count += 1;
        if (e.metadata?.results_count === 0) existing.zeroResults += 1;
        if (new Date(e.created_at).getTime() > new Date(existing.lastSearched).getTime()) {
          existing.lastSearched = e.created_at;
        }
        map.set(q, existing);
      });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 15);
  }, [filteredEvents]);

  // Device & Platform Breakdown
  const deviceStats = useMemo(() => {
    const devices = { Desktop: 0, Mobile: 0, Tablet: 0 };
    const browsers = {};
    const oses = {};

    filteredEvents.forEach((e) => {
      const dev = e.metadata?.device || "Desktop";
      if (devices[dev] !== undefined) devices[dev] += 1;
      else devices.Desktop += 1;

      const br = e.metadata?.browser || "Other";
      browsers[br] = (browsers[br] || 0) + 1;

      const o = e.metadata?.os || "Other";
      oses[o] = (oses[o] || 0) + 1;
    });

    const total = Math.max(1, filteredEvents.length);
    return {
      devices,
      devicePcts: {
        Desktop: Math.round((devices.Desktop / total) * 100),
        Mobile: Math.round((devices.Mobile / total) * 100),
        Tablet: Math.round((devices.Tablet / total) * 100),
      },
      topBrowsers: Object.entries(browsers).sort((a, b) => b[1] - a[1]).slice(0, 4),
      topOses: Object.entries(oses).sort((a, b) => b[1] - a[1]).slice(0, 4),
    };
  }, [filteredEvents]);

  // Group all events by unique user / visitor for Detailed User Journeys
  const usersList = useMemo(() => {
    const userMap = new Map();

    filteredEvents.forEach((ev) => {
      const isRegistered =
        ev.user_email &&
        ev.user_email !== "Anonymous Visitor" &&
        ev.user_email !== "Registered User" &&
        ev.user_email.includes("@");

      const userKey = isRegistered ? ev.user_email : (ev.user_id || ev.session_id || "anonymous_visitor");

      let user = userMap.get(userKey);
      if (!user) {
        user = {
          key: userKey,
          isRegistered: Boolean(isRegistered),
          email: isRegistered ? ev.user_email : null,
          id: ev.user_id || ev.session_id || userKey,
          displayName: isRegistered
            ? ev.user_email
            : `Visitor #${String(ev.user_id || ev.session_id || userKey).slice(-5)}`,
          firstSeen: ev.created_at,
          lastActive: ev.created_at,
          totalEvents: 0,
          pageViews: 0,
          copies: 0,
          previews: 0,
          searches: 0,
          likes: 0,
          upgrades: 0,
          timeOnPageSeconds: 0,
          device: ev.metadata?.device || "Desktop",
          browser: ev.metadata?.browser || "Other",
          os: ev.metadata?.os || "Other",
          timezone: ev.metadata?.timezone || "UTC",
          language: ev.metadata?.language || "en",
          pathsVisited: new Set(),
          searchesList: [],
          copiedTemplates: [],
          previewedTemplates: [],
          events: [],
        };
        userMap.set(userKey, user);
      }

      if (new Date(ev.created_at).getTime() < new Date(user.firstSeen).getTime()) {
        user.firstSeen = ev.created_at;
      }
      if (new Date(ev.created_at).getTime() > new Date(user.lastActive).getTime()) {
        user.lastActive = ev.created_at;
      }

      user.totalEvents += 1;
      user.events.push(ev);

      if (ev.path) user.pathsVisited.add(ev.path);
      if (ev.metadata?.device) user.device = ev.metadata.device;
      if (ev.metadata?.browser) user.browser = ev.metadata.browser;
      if (ev.metadata?.os) user.os = ev.metadata.os;

      if (ev.event_type === "page_view") {
        user.pageViews += 1;
      } else if (ev.event_type === "prompt_copy") {
        user.copies += 1;
        const title = ev.metadata?.template_title || ev.event_name.replace('Copied "', "").replace('"', "");
        if (title && !user.copiedTemplates.includes(title)) user.copiedTemplates.push(title);
      } else if (ev.event_type === "video_preview" || ev.event_type === "preview_duration") {
        if (ev.event_type === "video_preview") user.previews += 1;
        const title = ev.metadata?.template_title || ev.event_name.replace('Previewed "', "").replace('"', "");
        if (title && !user.previewedTemplates.includes(title)) user.previewedTemplates.push(title);
      } else if (ev.event_type === "search_query") {
        user.searches += 1;
        const q = ev.metadata?.query || ev.event_name.replace('Searched "', "").replace('"', "");
        if (q && !user.searchesList.includes(q)) user.searchesList.push(q);
      } else if (ev.event_type === "template_like") {
        user.likes += 1;
      } else if (ev.event_type === "upgrade_click" || ev.event_type === "pricing_view") {
        user.upgrades += 1;
      } else if (ev.event_type === "time_on_page" || (ev.metadata?.duration_seconds && ev.event_type !== "preview_duration")) {
        user.timeOnPageSeconds += Number(ev.metadata?.duration_seconds) || 0;
      }
    });

    const list = Array.from(userMap.values());
    list.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
    return list;
  }, [filteredEvents]);

  // Filtered users list based on search and type filter
  const filteredUsersList = useMemo(() => {
    return usersList.filter((u) => {
      if (userTypeFilter === "registered" && !u.isRegistered) return false;
      if (userTypeFilter === "anonymous" && u.isRegistered) return false;
      if (userSearchTerm.trim()) {
        const term = userSearchTerm.toLowerCase();
        const matchesKey = u.key.toLowerCase().includes(term);
        const matchesName = u.displayName.toLowerCase().includes(term);
        const matchesDevice = (u.device || "").toLowerCase().includes(term);
        const matchesBrowser = (u.browser || "").toLowerCase().includes(term);
        if (!matchesKey && !matchesName && !matchesDevice && !matchesBrowser) return false;
      }
      return true;
    });
  }, [usersList, userTypeFilter, userSearchTerm]);

  // Selected user and their chronological action timeline
  const selectedUser = useMemo(() => {
    if (!selectedUserKey) return null;
    return usersList.find((u) => u.key === selectedUserKey) || null;
  }, [usersList, selectedUserKey]);

  const selectedUserTimeline = useMemo(() => {
    if (!selectedUser) return [];
    let list = [...selectedUser.events];
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (userModalFilter !== "all") {
      if (userModalFilter === "time_on_page") {
        list = list.filter((e) => e.event_type === "time_on_page" || e.event_type === "preview_duration");
      } else {
        list = list.filter((e) => e.event_type === userModalFilter);
      }
    }
    if (timelineSearchTerm.trim()) {
      const q = timelineSearchTerm.toLowerCase();
      list = list.filter((e) => {
        const name = (e.event_name || "").toLowerCase();
        const type = (e.event_type || "").toLowerCase();
        const path = (e.path || "").toLowerCase();
        const query = (e.metadata?.query || "").toLowerCase();
        const tTitle = (e.metadata?.template_title || "").toLowerCase();
        return name.includes(q) || type.includes(q) || path.includes(q) || query.includes(q) || tTitle.includes(q);
      });
    }
    return list;
  }, [selectedUser, userModalFilter, timelineSearchTerm]);

  // Breakdown of routes visited with count
  const userRouteBreakdown = useMemo(() => {
    if (!selectedUser) return [];
    const counts = {};
    selectedUser.events.forEach((ev) => {
      const p = ev.path || "/";
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count);
  }, [selectedUser]);

  // Daily Timeline Chart Data (Last 7 or 14 points)
  const timelineData = useMemo(() => {
    const dayBuckets = {};
    const numDays = timeRange === "24h" ? 1 : timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 14;

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dayBuckets[key] = { key, label, views: 0, copies: 0, previews: 0 };
    }

    filteredEvents.forEach((e) => {
      const key = (e.created_at || "").split("T")[0];
      if (dayBuckets[key]) {
        if (e.event_type === "page_view") dayBuckets[key].views += 1;
        if (e.event_type === "prompt_copy") dayBuckets[key].copies += 1;
        if (e.event_type === "video_preview") dayBuckets[key].previews += 1;
      }
    });

    return Object.values(dayBuckets);
  }, [filteredEvents, timeRange]);

  const maxTimelineVal = useMemo(() => {
    return Math.max(1, ...timelineData.map((d) => Math.max(d.views, d.copies, d.previews)));
  }, [timelineData]);

  // Live Stream filtered by type
  const liveStreamEvents = useMemo(() => {
    if (eventFilter === "all") return filteredEvents.slice(0, 120);
    if (eventFilter === "time_on_page") {
      return filteredEvents.filter((e) => e.event_type === "time_on_page" || e.event_type === "preview_duration").slice(0, 120);
    }
    return filteredEvents.filter((e) => e.event_type === eventFilter).slice(0, 120);
  }, [filteredEvents, eventFilter]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = ["Timestamp", "Event Type", "Event Name", "User / Visitor", "Path", "Device", "Browser", "OS", "Details"];
    const rows = filteredEvents.map((e) => [
      e.created_at,
      e.event_type,
      `"${(e.event_name || "").replace(/"/g, '""')}"`,
      e.user_email || e.user_id,
      e.path,
      e.metadata?.device || "Desktop",
      e.metadata?.browser || "Unknown",
      e.metadata?.os || "Unknown",
      `"${JSON.stringify(e.metadata || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `flowsites_telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 select-none">
      {/* ── Top Header Controls Bar (Gallery Liquid Glass Header Style) ── */}
      <div className="relative px-4 py-3 sm:px-6 sm:py-3.5 rounded-[18px] bg-gradient-to-b from-[#141419]/90 via-[#0e0e13]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl overflow-hidden">
        {/* Top specular highlight edge line */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 relative z-10">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Website Telemetry</span>
              </h2>
              {/* Live Pulsing Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10.5px] font-semibold tracking-wide uppercase shadow-[0_0_12px_rgba(52,211,153,0.15)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Active</span>
              </div>
            </div>
            <p className="text-xs text-white/50 mt-0.5 font-normal line-clamp-1">
              High-resolution activity intelligence: visitor flows, prompt conversions, preview plays, and keyword demand.
            </p>
          </div>

          {/* Action Tools & Timeframe Chips */}
          <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 shrink-0 w-full md:w-auto justify-start md:justify-end">
            {/* Timeframe Chips (Gallery Pill Style) */}
            <div className="flex items-center p-0.5 sm:p-1 rounded-full bg-white/[0.04] border border-white/10 border-t-white/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] backdrop-blur-md">
              {[
                { id: "24h", label: "24 Hours" },
                { id: "7d", label: "7 Days" },
                { id: "30d", label: "30 Days" },
                { id: "all", label: "All Time" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeRange(t.id)}
                  className={`relative px-2.5 sm:px-3 py-1 rounded-full text-[11.5px] sm:text-xs font-medium transition-all duration-300 cursor-pointer ${
                    timeRange === t.id
                      ? "text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {timeRange === t.id && (
                    <motion.div
                      layoutId="activeTimeframePill"
                      className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-white/5 border border-white/20 border-t-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-md"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Refresh Pill Button */}
            <button
              type="button"
              onClick={loadData}
              title="Refresh live stream"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-white/70 hover:text-white border border-white/10 border-t-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-white" : ""}`} />
            </button>

            {/* Export CSV Pill */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white/85 hover:text-white text-xs font-medium border border-white/10 border-t-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-white/70" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 6 Tactile Luxury KPI Cards (Gallery Liquid Glass Depth) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Total Page Views */}
        <div className="group relative p-5 rounded-[22px] bg-gradient-to-b from-[#141419]/90 via-[#0e0e13]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-white/20 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/30 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium tracking-wide uppercase text-white/45">Page Views</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.15)]">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
            {formatNumber(stats.pageViews)}
          </div>
          <div className="text-[10.5px] text-white/40 flex items-center gap-1 font-medium truncate">
            <span className="text-sky-400 font-semibold">+{stats.uniqueSessions}</span>
            <span>sessions</span>
          </div>
        </div>

        {/* Card 2: Unique Visitors */}
        <div
          onClick={() => setActiveTab("users")}
          className="group relative p-5 rounded-[22px] bg-gradient-to-b from-[#141419]/90 via-[#0e0e13]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-purple-500/40 hover:scale-[1.01] transition-all duration-300 overflow-hidden cursor-pointer"
          title="Click to view all visitor journeys"
        >
          <div className="absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/30 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium tracking-wide uppercase text-white/45">Visitors</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_14px_rgba(168,85,247,0.15)] group-hover:scale-110 transition-transform">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
            {formatNumber(stats.uniqueVisitors)}
          </div>
          <div className="text-[10.5px] text-purple-400 flex items-center justify-between font-medium">
            <span>{deviceStats.devicePcts.Desktop}% desktop</span>
            <span className="text-[9.5px] text-purple-300/80 group-hover:text-purple-300 font-semibold flex items-center gap-0.5">
              Journeys <ChevronRight className="w-3 h-3 inline" />
            </span>
          </div>
        </div>

        {/* Card 3: Avg Time on Page (Genuine Duration Intelligence) */}
        <div className="group relative p-5 rounded-[22px] bg-gradient-to-b from-[#141419]/90 via-[#0e0e13]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-white/20 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-teal-400/35 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium tracking-wide uppercase text-white/45">Avg Time On Page</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-[0_0_14px_rgba(45,212,191,0.15)]">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1 font-mono">
            {stats.avgTimeFormatted || "0s"}
          </div>
          <div className="text-[10.5px] text-teal-400/90 flex items-center gap-1 font-medium truncate">
            <span className="font-semibold">{stats.timeEventsCount}</span>
            <span>durations logged</span>
          </div>
        </div>

        {/* Card 4: Prompt Copies */}
        <div className="group relative p-5 rounded-[22px] bg-gradient-to-b from-[#141419]/90 via-[#0e0e13]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-white/20 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/35 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium tracking-wide uppercase text-white/45">Copies</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.15)]">
              <Copy className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
            {formatNumber(stats.promptCopies)}
          </div>
          <div className="text-[10.5px] text-emerald-400 font-semibold flex items-center gap-1 truncate">
            <TrendingUp className="w-3 h-3" />
            <span>{stats.copyRate}% copy rate</span>
          </div>
        </div>

        {/* Card 5: Video Previews */}
        <div className="group relative p-5 rounded-[22px] bg-gradient-to-b from-[#141419]/90 via-[#0e0e13]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-white/20 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium tracking-wide uppercase text-white/45">Previews</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.15)]">
              <Play className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
            {formatNumber(stats.videoPreviews)}
          </div>
          <div className="text-[10.5px] text-amber-400/90 font-medium flex items-center gap-1 truncate">
            <span>{stats.previewRate}% preview rate</span>
          </div>
        </div>

        {/* Card 6: Searches & Intent */}
        <div className="group relative p-5 rounded-[22px] bg-gradient-to-b from-[#141419]/90 via-[#0e0e13]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-white/20 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-rose-400/30 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium tracking-wide uppercase text-white/45">Searches</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-[0_0_14px_rgba(244,63,94,0.15)]">
              <Search className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
            {formatNumber(stats.searches)}
          </div>
          <div className="text-[10.5px] text-rose-400 font-semibold flex items-center gap-1 truncate">
            <Sparkles className="w-3 h-3" />
            <span>{stats.upgradeClicks} upgrades</span>
          </div>
        </div>
      </div>

      {/* ── Main Interactive Visual Charts (Liquid Dark Slate Glass) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Timeline Multi-Metric Visual Chart */}
        <div className="lg:col-span-2 relative p-6 sm:p-7 rounded-[26px] bg-gradient-to-b from-[#121217]/95 via-[#0d0d12]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_20px_48px_-12px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="font-display text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Activity Timeline</span>
                </h3>
                <p className="text-xs text-white/40 mt-0.5">Chronological comparison of visitor volume, prompt copies, and previews</p>
              </div>

              {/* Chart Legend Chips */}
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-sky-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                  Views
                </span>
                <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  Copies
                </span>
                <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                  Previews
                </span>
              </div>
            </div>

            {/* Interactive Tactile Timeline Bars */}
            <div className="h-52 flex items-end gap-2.5 pt-6 px-1 border-b border-white/5 pb-2">
              {timelineData.map((day, idx) => {
                const viewH = Math.min(100, Math.round((day.views / maxTimelineVal) * 100));
                const copyH = Math.min(100, Math.round((day.copies / maxTimelineVal) * 100));
                const prevH = Math.min(100, Math.round((day.previews / maxTimelineVal) * 100));
                const isHovered = activeBarHover === idx;

                return (
                  <div
                    key={day.key}
                    onMouseEnter={() => setActiveBarHover(idx)}
                    onMouseLeave={() => setActiveBarHover(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  >
                    {/* Floating Glass Tooltip */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.95 }}
                          className="absolute -top-16 z-30 flex flex-col items-center px-3 py-1.5 rounded-xl bg-[#16161e]/95 backdrop-blur-xl border border-white/20 border-t-white/35 shadow-[0_12px_28px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.2)] whitespace-nowrap pointer-events-none"
                        >
                          <span className="text-[11px] font-bold text-white mb-0.5">{day.label}</span>
                          <span className="text-[10px] text-white/60">
                            {day.views} views • {day.copies} copies • {day.previews} plays
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bars Column */}
                    <div className="w-full max-w-[32px] flex items-end gap-1 h-full">
                      <div
                        style={{ height: `${Math.max(6, viewH)}%` }}
                        className={`flex-1 rounded-t-md transition-all duration-200 ${
                          isHovered
                            ? "bg-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                            : "bg-sky-400/80 group-hover:bg-sky-400"
                        }`}
                      />
                      <div
                        style={{ height: `${Math.max(6, copyH)}%` }}
                        className={`flex-1 rounded-t-md transition-all duration-200 ${
                          isHovered
                            ? "bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
                            : "bg-emerald-400/80 group-hover:bg-emerald-400"
                        }`}
                      />
                      <div
                        style={{ height: `${Math.max(6, prevH)}%` }}
                        className={`flex-1 rounded-t-md transition-all duration-200 ${
                          isHovered
                            ? "bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                            : "bg-amber-400/80 group-hover:bg-amber-400"
                        }`}
                      />
                    </div>

                    <span className="text-[10px] text-white/40 mt-2.5 truncate w-full text-center font-mono">
                      {day.label.split(" ")[1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Device & Hardware Platform Card */}
        <div className="relative p-6 sm:p-7 rounded-[26px] bg-gradient-to-b from-[#121217]/95 via-[#0d0d12]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_20px_48px_-12px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

          <div>
            <h3 className="font-display text-lg font-bold text-white tracking-tight mb-1">Hardware & Device</h3>
            <p className="text-xs text-white/40 mb-5">Traffic distribution across client screens & OS</p>

            {/* Segmented Gradient Pill Bar */}
            <div className="h-3 w-full rounded-full bg-white/[0.06] overflow-hidden flex mb-5 p-0.5 border border-white/10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
              <div
                style={{ width: `${Math.max(4, deviceStats.devicePcts.Desktop)}%` }}
                className="bg-gradient-to-r from-sky-400 to-sky-500 h-full rounded-l-full shadow-[0_0_8px_rgba(56,189,248,0.4)]"
                title={`Desktop: ${deviceStats.devicePcts.Desktop}%`}
              />
              <div
                style={{ width: `${Math.max(4, deviceStats.devicePcts.Mobile)}%` }}
                className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                title={`Mobile: ${deviceStats.devicePcts.Mobile}%`}
              />
              <div
                style={{ width: `${Math.max(4, deviceStats.devicePcts.Tablet)}%` }}
                className="bg-gradient-to-r from-purple-400 to-purple-500 h-full rounded-r-full shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                title={`Tablet: ${deviceStats.devicePcts.Tablet}%`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mb-6">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-sm font-bold text-white">{deviceStats.devicePcts.Desktop}%</div>
                <div className="text-[10px] text-sky-400 font-medium mt-0.5">Desktop</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-sm font-bold text-white">{deviceStats.devicePcts.Mobile}%</div>
                <div className="text-[10px] text-emerald-400 font-medium mt-0.5">Mobile</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-sm font-bold text-white">{deviceStats.devicePcts.Tablet}%</div>
                <div className="text-[10px] text-purple-400 font-medium mt-0.5">Tablet</div>
              </div>
            </div>

            {/* Top Browsers & Platforms List */}
            <div className="border-t border-white/5 pt-4">
              <div className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2.5">
                Top Client Environments
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {deviceStats.topBrowsers.map(([name, count]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
                  >
                    <span className="text-white/80 font-medium truncate">{name}</span>
                    <span className="text-white/40 font-mono text-[11px]">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-Tab Navigation Bar (Gallery Style Category Chips) ── */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto no-scrollbar">
        {[
          { id: "overview", label: "Top Templates Leaderboard", icon: Flame },
          { id: "users", label: "Visitors & User Journeys", icon: Users },
          { id: "searches", label: "Search Intelligence", icon: Search },
          { id: "live", label: "Real-Time Telemetry Stream", icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer ${
                isActive
                  ? "text-white shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
                  : "text-white/60 hover:text-white/90 bg-white/[0.03] border border-white/5 hover:bg-white/[0.08]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeSubTabPill"
                  className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-white/5 border border-white/20 border-t-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_rgba(0,0,0,0.5)] backdrop-blur-md"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab 1: Top Templates Leaderboard ── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Copied Prompts */}
          <div className="relative p-6 sm:p-7 rounded-[26px] bg-gradient-to-b from-[#121217]/95 via-[#0d0d12]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_20px_48px_-12px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl overflow-hidden">
            <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Copy className="w-4 h-4 text-emerald-400" />
                  Most Copied Prompts
                </h3>
                <p className="text-xs text-white/40 mt-0.5">Templates with highest prompt conversion</p>
              </div>
              <span className="text-xs text-emerald-400/80 font-mono font-medium">{topCopied.length} tracked</span>
            </div>

            <div className="space-y-2.5">
              {topCopied.length === 0 ? (
                <div className="py-12 text-center text-xs text-white/40">No prompt copies recorded yet.</div>
              ) : (
                topCopied.map((item, idx) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-xs font-mono font-semibold text-white/40 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{item.title}</div>
                        <div className="text-[11px] text-white/40 truncate">{item.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div>
                        <div className="text-sm font-bold text-emerald-400 font-mono">{item.copies} copies</div>
                        {item.previews > 0 && (
                          <div className="text-[10px] text-white/40">{item.previews} video plays</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Most Played Video Previews */}
          <div className="relative p-6 sm:p-7 rounded-[26px] bg-gradient-to-b from-[#121217]/95 via-[#0d0d12]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_20px_48px_-12px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl overflow-hidden">
            <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-amber-400" />
                  Most Played Video Previews
                </h3>
                <p className="text-xs text-white/40 mt-0.5">Templates watched most often by visitors</p>
              </div>
              <span className="text-xs text-amber-400/80 font-mono font-medium">{topPreviews.length} tracked</span>
            </div>

            <div className="space-y-2.5">
              {topPreviews.length === 0 ? (
                <div className="py-12 text-center text-xs text-white/40">No video previews recorded yet.</div>
              ) : (
                topPreviews.map((item, idx) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-xs font-mono font-semibold text-white/40 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{item.title}</div>
                        <div className="text-[11px] text-white/40 truncate">{item.category}</div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-bold text-amber-400 font-mono">{item.count} plays</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Visitors & User Journeys ── */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Top Control Header Card */}
          <div className="relative p-6 sm:p-7 rounded-[26px] bg-gradient-to-b from-[#121217]/95 via-[#0d0d12]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_20px_48px_-12px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl overflow-hidden">
            <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/35 to-transparent pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6">
              <div>
                <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span>Visitors & User Journeys</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
                    {usersList.length} unique profiles
                  </span>
                </h3>
                <p className="text-xs text-white/40 mt-1">
                  Click on any user or anonymous visitor below to inspect their step-by-step telemetry dossier, watch time, and click trail.
                </p>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative min-w-[220px] sm:min-w-[280px]">
                  <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Search by email, visitor ID, device..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.08] border border-white/10 text-white placeholder-white/35 text-xs outline-none focus:border-purple-400/50 transition-all"
                  />
                  {userSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setUserSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10 text-xs">
                  {[
                    { id: "all", label: `All (${usersList.length})` },
                    { id: "registered", label: `Registered (${usersList.filter((u) => u.isRegistered).length})` },
                    { id: "anonymous", label: `Anonymous (${usersList.filter((u) => !u.isRegistered).length})` },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setUserTypeFilter(f.id)}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                        userTypeFilter === f.id
                          ? "bg-purple-500/25 text-purple-300 font-semibold border border-purple-500/40 shadow-sm"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Visitors Table / List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 uppercase font-mono text-[10px] tracking-wider">
                    <th className="py-3 px-4">Visitor / Account</th>
                    <th className="py-3 px-4">Client Context</th>
                    <th className="py-3 px-4">Time On Site</th>
                    <th className="py-3 px-4">Touchpoints & Actions</th>
                    <th className="py-3 px-4">Last Active</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-white/40 text-xs">
                        No visitors match your current filter or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsersList.map((user) => (
                      <tr
                        key={user.key}
                        onClick={() => handleSelectUser(user.key)}
                        className="group hover:bg-white/[0.03] transition-colors cursor-pointer"
                      >
                        {/* Visitor Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                user.isRegistered
                                  ? "bg-purple-500/15 text-purple-400 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                                  : "bg-sky-500/15 text-sky-400 border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.12)]"
                              }`}
                            >
                              {user.isRegistered ? <UserCheck className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-white group-hover:text-purple-300 transition-colors truncate flex items-center gap-2">
                                <span>{user.displayName}</span>
                                {user.isRegistered ? (
                                  <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                                    Registered
                                  </span>
                                ) : (
                                  <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10 font-mono">
                                    Anonymous
                                  </span>
                                )}
                              </div>
                              <div className="text-[10.5px] text-white/40 font-mono truncate mt-0.5">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Device / Client Context */}
                        <td className="py-3.5 px-4 text-white/70">
                          <div className="flex items-center gap-1.5 font-medium">
                            {user.device === "Mobile" ? (
                              <Smartphone className="w-3.5 h-3.5 text-white/40" />
                            ) : (
                              <Monitor className="w-3.5 h-3.5 text-white/40" />
                            )}
                            <span>{user.device}</span>
                            <span className="text-white/30">•</span>
                            <span className="text-white/50 font-normal">{user.os} ({user.browser})</span>
                          </div>
                        </td>

                        {/* Time On Site */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/25 font-mono font-medium text-xs">
                            <Clock className="w-3 h-3" />
                            <span>{formatDuration(user.timeOnPageSeconds)}</span>
                          </span>
                        </td>

                        {/* Actions badges */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-white/70 font-mono text-[11px]">
                              {user.totalEvents} events
                            </span>
                            {user.copies > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
                                {user.copies} copies
                              </span>
                            )}
                            {user.previews > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[11px]">
                                {user.previews} previews
                              </span>
                            )}
                            {user.searches > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono text-[11px]">
                                {user.searches} searches
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Last Active */}
                        <td className="py-3.5 px-4 font-mono text-white/40 text-[11px]">
                          {formatRelativeTime(user.lastActive)}
                        </td>

                        {/* Button Action */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectUser(user.key);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white border border-white/10 text-xs font-medium transition-all group-hover:border-purple-400/40 group-hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] cursor-pointer"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: Search Intelligence ── */}
      {activeTab === "searches" && (
        <div className="relative p-6 sm:p-7 rounded-[26px] bg-gradient-to-b from-[#121217]/95 via-[#0d0d12]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_20px_48px_-12px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl overflow-hidden">
          <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-rose-400/30 to-transparent pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-rose-400" />
                Search Intelligence & Keyword Demand
              </h3>
              <p className="text-xs text-white/40 mt-0.5">Exact queries visitors type in the gallery search bar</p>
            </div>
            <span className="text-xs font-mono text-white/40">{topSearches.length} unique terms recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/40 uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Keyword Query</th>
                  <th className="py-3.5 px-4">Search Volume</th>
                  <th className="py-3.5 px-4">Result Status</th>
                  <th className="py-3.5 px-4 text-right">Last Searched</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topSearches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-white/40">
                      No search queries recorded yet.
                    </td>
                  </tr>
                ) : (
                  topSearches.map((item, idx) => (
                    <tr key={item.query} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-white/30">#{idx + 1}</td>
                      <td className="py-3.5 px-4 font-medium text-white">
                        <span className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-white/90 shadow-sm">
                          {item.query}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-sky-400 font-mono">{item.count} searches</td>
                      <td className="py-3.5 px-4">
                        {item.zeroResults > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            {item.zeroResults} zero-result searches (create template!)
                          </span>
                        ) : (
                          <span className="text-emerald-400/80 font-medium">Matched templates</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-white/40 font-mono">
                        {formatRelativeTime(item.lastSearched)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 3: Real-Time Telemetry Stream ── */}
      {activeTab === "live" && (
        <div className="relative p-6 sm:p-7 rounded-[26px] bg-gradient-to-b from-[#121217]/95 via-[#0d0d12]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_20px_48px_-12px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl overflow-hidden">
          <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                Real-Time User Action Stream
              </h3>
              <p className="text-xs text-white/40 mt-0.5">Chronological feed of every visitor touchpoint in real-time</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10 text-xs">
              {[
                { id: "all", label: "All" },
                { id: "prompt_copy", label: "Copies" },
                { id: "video_preview", label: "Previews" },
                { id: "time_on_page", label: "Time on Page" },
                { id: "search_query", label: "Searches" },
                { id: "page_view", label: "Views" },
                { id: "upgrade_click", label: "Upgrades" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setEventFilter(f.id)}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    eventFilter === f.id
                      ? "bg-white/20 text-white font-semibold shadow-sm"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {liveStreamEvents.length === 0 ? (
              <div className="py-16 text-center text-xs text-white/40">No events found matching this filter.</div>
            ) : (
              liveStreamEvents.map((ev) => {
                const isCopy = ev.event_type === "prompt_copy";
                const isPreview = ev.event_type === "video_preview";
                const isPreviewDuration = ev.event_type === "preview_duration";
                const isTimeOnPage = ev.event_type === "time_on_page";
                const isSearch = ev.event_type === "search_query";
                const isUpgrade = ev.event_type === "upgrade_click" || ev.event_type === "pricing_view";

                const isRegistered =
                  ev.user_email &&
                  ev.user_email !== "Anonymous Visitor" &&
                  ev.user_email !== "Registered User" &&
                  ev.user_email.includes("@");
                const userKey = isRegistered ? ev.user_email : (ev.user_id || ev.session_id || "anonymous_visitor");

                return (
                  <div
                    key={ev.id || `${ev.created_at}_${Math.random()}`}
                    onClick={() => handleSelectUser(userKey)}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-purple-500/30 transition-all text-xs cursor-pointer group"
                    title="Click to view full user journey"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Tactile Icon Badge */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isCopy
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.15)]"
                            : isPreview || isPreviewDuration
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(251,191,36,0.15)]"
                            : isTimeOnPage
                            ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-[0_0_12px_rgba(45,212,191,0.15)]"
                            : isSearch
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                            : isUpgrade
                            ? "bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                            : "bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
                        }`}
                      >
                        {isCopy ? (
                          <Copy className="w-4 h-4" />
                        ) : isPreview || isPreviewDuration ? (
                          <Play className="w-4 h-4" />
                        ) : isTimeOnPage ? (
                          <Clock className="w-4 h-4" />
                        ) : isSearch ? (
                          <Search className="w-4 h-4" />
                        ) : isUpgrade ? (
                          <Sparkles className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </div>

                      {/* Event Detail */}
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate flex items-center gap-2">
                          <span>{ev.event_name}</span>
                          {ev.metadata?.formatted_duration && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 font-mono font-medium">
                              ⏱ {ev.metadata.formatted_duration}
                            </span>
                          )}
                          <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10 uppercase tracking-wider font-mono">
                            {ev.event_type.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="text-[11px] text-white/40 truncate flex items-center gap-2 mt-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectUser(userKey);
                            }}
                            className="text-white/70 hover:text-purple-300 font-mono hover:underline cursor-pointer flex items-center gap-1.5 transition-colors group/user"
                          >
                            <span className="truncate">{ev.user_email || `Visitor #${String(ev.user_id || ev.session_id || "").slice(-5)}`}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 group-hover/user:bg-purple-500/20 group-hover/user:text-purple-300 font-sans">
                              Dossier ↗
                            </span>
                          </button>
                          <span>•</span>
                          <span>{ev.metadata?.device || "Desktop"} ({ev.metadata?.browser || "Browser"})</span>
                          <span>•</span>
                          <span className="text-white/40">{ev.path}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right ml-4 flex items-center gap-2.5">
                      <span className="text-[11px] font-mono text-white/40">
                        {formatRelativeTime(ev.created_at)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectUser(userKey);
                        }}
                        className="hidden sm:inline-flex opacity-0 group-hover:opacity-100 px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-purple-500/20 text-white/70 hover:text-purple-300 border border-white/10 text-[11px] font-medium transition-all cursor-pointer"
                      >
                        Inspect →
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Complete Full-Screen User Dossier Page (Portaled to document.body) ── */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selectedUser && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[9999] bg-[#07070a] overflow-y-auto w-full h-full text-white flex flex-col selection:bg-purple-500/30"
              >
                {/* Top Ambient Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[320px] bg-gradient-to-b from-purple-600/15 via-sky-600/10 to-transparent blur-[140px] pointer-events-none" />

                {/* Single Clean Sticky Top Command Bar */}
                <header className="sticky top-0 z-50 bg-[#07070a]/95 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-8 py-3 shrink-0 shadow-lg">
                  <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
                    {/* Left: Back Button & User Info */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <button
                        type="button"
                        onClick={handleCloseUser}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/15 hover:border-white/25 text-white text-xs font-semibold transition-all cursor-pointer group shadow-sm shrink-0"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Back to Analytics</span>
                        <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono">
                          ESC
                        </kbd>
                      </button>

                      <div className="h-4 w-[1px] bg-white/15 hidden sm:block shrink-0" />

                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-white/40 font-mono hidden md:inline">User Dossier:</span>
                        <span className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs font-display">
                          {selectedUser.displayName}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ${
                            selectedUser.isRegistered
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/35"
                              : "bg-sky-500/15 text-sky-300 border-sky-500/30 font-mono"
                          }`}
                        >
                          {selectedUser.isRegistered ? "Registered" : "Anonymous"}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium mr-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        <span>Live Telemetry</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyUserId(selectedUser.key || selectedUser.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/80 hover:text-white text-xs font-medium transition-all cursor-pointer"
                        title="Copy User Identifier"
                      >
                        {copiedUserId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Copy ID</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportUserJson(selectedUser)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-medium transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                        title="Download complete JSON report of this user's activity"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Export JSON</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCloseUser}
                        className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer ml-1"
                        aria-label="Close user dossier"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </header>

                {/* Dossier Body Content Container */}
                <main className="relative max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8 flex-1">
                  {/* 1. Large Hero User Profile Card */}
                  <div className="relative p-6 sm:p-8 rounded-[32px] bg-gradient-to-b from-[#14141c]/95 via-[#0e0e14]/95 to-[#08080c]/98 border border-white/10 border-t-white/25 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.15)] overflow-hidden">
                    <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent pointer-events-none" />

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Left: Avatar & Identities */}
                      <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-1">
                        <div
                          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center shrink-0 border shadow-2xl ${
                            selectedUser.isRegistered
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                              : "bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-[0_0_30px_rgba(56,189,248,0.25)]"
                          }`}
                        >
                          {selectedUser.isRegistered ? (
                            <UserCheck className="w-8 h-8 sm:w-10 sm:h-10" />
                          ) : (
                            <Globe className="w-8 h-8 sm:w-10 sm:h-10" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight truncate">
                              {selectedUser.displayName}
                            </h1>
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                                selectedUser.isRegistered
                                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                                  : "bg-sky-500/15 text-sky-300 border-sky-500/35 font-mono"
                              }`}
                            >
                              {selectedUser.isRegistered ? "Registered User" : "Anonymous Visitor"}
                            </span>
                          </div>

                          {/* Client Environment Chips */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 font-mono">
                              <span className="text-white/40">ID:</span>
                              <span className="truncate max-w-[180px] sm:max-w-[260px]">{selectedUser.id}</span>
                            </span>

                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10">
                              {selectedUser.device === "Mobile" ? (
                                <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                              ) : (
                                <Laptop className="w-3.5 h-3.5 text-purple-400" />
                              )}
                              <span>{selectedUser.device}</span>
                            </span>

                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10">
                              <Monitor className="w-3.5 h-3.5 text-white/40" />
                              <span>{selectedUser.os} ({selectedUser.browser})</span>
                            </span>

                            {selectedUser.timezone && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 font-mono">
                                <Clock className="w-3.5 h-3.5 text-teal-400" />
                                <span>{selectedUser.timezone}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Lifecycle Timestamps Glass Panel */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-2.5 text-xs shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/10 min-w-[240px]">
                        <div className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-4 font-mono">
                          <span className="text-white/40 text-[10.5px] uppercase tracking-wider">First Seen</span>
                          <span className="text-white/80 font-medium text-right text-[11.5px]">{formatExactDateTime(selectedUser.firstSeen)}</span>
                        </div>
                        <div className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-4 font-mono">
                          <span className="text-white/40 text-[10.5px] uppercase tracking-wider">Last Active</span>
                          <span className="text-white font-semibold flex items-center gap-1.5 text-right text-[11.5px]">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            {formatRelativeTime(selectedUser.lastActive)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Key Metrics Matrix (6 Spacious Symmetrical Cards) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                    {[
                      { label: "Time on Site", val: formatDuration(selectedUser.timeOnPageSeconds), sub: "Total engagement", icon: Clock, color: "text-teal-400" },
                      { label: "Total Actions", val: selectedUser.totalEvents, sub: "Recorded touches", icon: Zap, color: "text-purple-400" },
                      { label: "Page Views", val: selectedUser.pageViews, sub: "Routes opened", icon: Eye, color: "text-sky-400" },
                      { label: "Copies", val: selectedUser.copies, sub: "Prompts copied", icon: Copy, color: "text-emerald-400" },
                      { label: "Previews", val: selectedUser.previews, sub: "Videos watched", icon: Play, color: "text-amber-400" },
                      { label: "Searches", val: selectedUser.searches, sub: "Queries typed", icon: Search, color: "text-rose-400" },
                    ].map((m) => {
                      const Icon = m.icon;
                      return (
                        <div
                          key={m.label}
                          className="flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 hover:border-white/20 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[10.5px] uppercase font-mono tracking-wider text-white/50 font-medium">
                              {m.label}
                            </span>
                            <Icon className={`w-4 h-4 ${m.color} opacity-80`} />
                          </div>
                          <div className="font-display text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight my-1">
                            {m.val}
                          </div>
                          <div className="text-[11px] text-white/40 font-mono mt-1">{m.sub}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 3. Behavioral Footprints (Routes Breakdown & Search Terms) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    {/* Visited Routes Breakdown */}
                    <div className="flex flex-col h-full p-5 sm:p-6 rounded-[24px] bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/10">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-sky-400" />
                          <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                            Visited Routes & Page Depth
                          </h3>
                        </div>
                        <span className="text-[11px] font-mono text-white/40">
                          {userRouteBreakdown.length} unique routes
                        </span>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1 flex-1">
                        {userRouteBreakdown.length === 0 ? (
                          <div className="py-8 text-center text-white/30 italic">No routes recorded.</div>
                        ) : (
                          userRouteBreakdown.map((item) => (
                            <div
                              key={item.path}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors font-mono"
                            >
                              <span className="text-white/80 font-medium truncate max-w-[80%]">{item.path}</span>
                              <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/25 text-[11px] shrink-0 font-semibold">
                                {item.count} touches
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Search Queries List */}
                    <div className="flex flex-col h-full p-5 sm:p-6 rounded-[24px] bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/10">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-rose-400" />
                          <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                            Search Queries & Keyword Intent
                          </h3>
                        </div>
                        <span className="text-[11px] font-mono text-white/40">
                          {selectedUser.searchesList.length} queries
                        </span>
                      </div>

                      <div className="max-h-64 overflow-y-auto pr-1 flex-1">
                        {selectedUser.searchesList.length === 0 ? (
                          <div className="py-8 text-center text-white/30 italic w-full">
                            This visitor has not typed any search queries yet.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {selectedUser.searchesList.map((q, idx) => (
                              <span
                                key={`${q}_${idx}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs shadow-sm"
                              >
                                <Search className="w-3 h-3 text-rose-400" />
                                <span>"{q}"</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. Expansive Chronological Action Trail (No middle line, clean cards) */}
                  <div className="p-6 sm:p-8 rounded-[30px] bg-gradient-to-b from-[#121217]/95 via-[#0d0d12]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-2xl relative">
                    {/* Header & Search / Filters */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
                      <div>
                        <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
                          <Activity className="w-5 h-5 text-purple-400" />
                          <span>Granular Activity Trail</span>
                        </h2>
                        <p className="text-xs text-white/40 mt-1">
                          Chronological feed of every single visitor touchpoint and user event
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Search inside user's timeline */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Search actions..."
                            value={timelineSearchTerm}
                            onChange={(e) => setTimelineSearchTerm(e.target.value)}
                            className="pl-8 pr-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/10 focus:border-purple-400/50 text-xs text-white placeholder-white/30 outline-none transition-all w-full sm:w-48"
                          />
                        </div>

                        {/* Timeline Filter Pills */}
                        <div className="flex flex-wrap items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10 text-xs">
                          {[
                            { id: "all", label: `All (${selectedUser.events.length})` },
                            { id: "prompt_copy", label: `Copies (${selectedUser.copies})` },
                            { id: "video_preview", label: `Previews (${selectedUser.previews})` },
                            { id: "time_on_page", label: "Time" },
                            { id: "search_query", label: `Searches (${selectedUser.searches})` },
                            { id: "page_view", label: `Views (${selectedUser.pageViews})` },
                          ].map((tf) => (
                            <button
                              key={tf.id}
                              type="button"
                              onClick={() => setUserModalFilter(tf.id)}
                              className={`px-3 py-1 rounded-full transition-all cursor-pointer text-[11px] ${
                                userModalFilter === tf.id
                                  ? "bg-white/20 text-white font-semibold shadow-sm"
                                  : "text-white/50 hover:text-white"
                              }`}
                            >
                              {tf.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Activity Feed Cards (Zero middle lines) */}
                    <div className="pt-6">
                      {selectedUserTimeline.length === 0 ? (
                        <div className="py-16 text-center text-xs text-white/40">
                          No actions match your current filter or search query for this user.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedUserTimeline.map((ev, index) => {
                            const isCopy = ev.event_type === "prompt_copy";
                            const isPreview = ev.event_type === "video_preview";
                            const isPreviewDuration = ev.event_type === "preview_duration";
                            const isTimeOnPage = ev.event_type === "time_on_page";
                            const isSearch = ev.event_type === "search_query";
                            const isUpgrade = ev.event_type === "upgrade_click" || ev.event_type === "pricing_view";

                            return (
                              <div
                                key={ev.id || `${ev.created_at}_${index}`}
                                className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.055] border border-white/[0.07] hover:border-purple-500/30 transition-all text-xs group"
                              >
                                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                                  {/* Clean Integrated Icon Badge */}
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-md ${
                                      isCopy
                                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.15)]"
                                        : isPreview || isPreviewDuration
                                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(251,191,36,0.15)]"
                                        : isTimeOnPage
                                        ? "bg-teal-500/15 text-teal-300 border-teal-500/30 shadow-[0_0_12px_rgba(45,212,191,0.15)]"
                                        : isSearch
                                        ? "bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                                        : isUpgrade
                                        ? "bg-purple-500/15 text-purple-400 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                                        : "bg-sky-500/15 text-sky-400 border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
                                    }`}
                                  >
                                    {isCopy ? (
                                      <Copy className="w-4 h-4" />
                                    ) : isPreview || isPreviewDuration ? (
                                      <Play className="w-4 h-4" />
                                    ) : isTimeOnPage ? (
                                      <Clock className="w-4 h-4" />
                                    ) : isSearch ? (
                                      <Search className="w-4 h-4" />
                                    ) : isUpgrade ? (
                                      <Sparkles className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </div>

                                  {/* Event Details */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-semibold text-white text-sm tracking-tight">{ev.event_name}</span>
                                      {ev.metadata?.formatted_duration && (
                                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 font-mono font-medium">
                                          ⏱ {ev.metadata.formatted_duration}
                                        </span>
                                      )}
                                      <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-white/60 uppercase text-[9px] font-mono">
                                        {ev.event_type.replace(/_/g, " ")}
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-white/50 font-mono">
                                      <span>Path: <strong className="text-white/80 font-normal">{ev.path || "/"}</strong></span>
                                      {ev.metadata?.query && (
                                        <>
                                          <span>•</span>
                                          <span className="text-rose-300 font-medium">Query: "{ev.metadata.query}"</span>
                                        </>
                                      )}
                                      {ev.metadata?.template_title && (
                                        <>
                                          <span>•</span>
                                          <span className="text-amber-300 font-medium">Template: "{ev.metadata.template_title}"</span>
                                        </>
                                      )}
                                      {ev.metadata?.scroll_depth && (
                                        <>
                                          <span>•</span>
                                          <span>Depth: {ev.metadata.scroll_depth}%</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Timestamps */}
                                <div className="shrink-0 text-right ml-2 sm:ml-4 font-mono text-white/40">
                                  <div className="text-xs text-white/70 font-medium">{formatRelativeTime(ev.created_at)}</div>
                                  <div className="text-[10px] text-white/30 mt-0.5 hidden sm:block">{formatExactDateTime(ev.created_at)}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </main>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

    </div>
  );
}
