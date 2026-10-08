import React, { useState, useEffect, useMemo, useCallback } from "react";
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

export default function AdminAnalytics() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d"); // "24h", "7d", "30d", "all"
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "searches", "live"
  const [eventFilter, setEventFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [activeBarHover, setActiveBarHover] = useState(null);

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
      <div className="relative p-5 sm:p-6 rounded-[24px] bg-gradient-to-b from-[#141419]/90 via-[#0e0e13]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl overflow-hidden">
        {/* Top specular highlight edge line */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <span>Website Telemetry</span>
              </h2>
              {/* Live Pulsing Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold tracking-wide uppercase shadow-[0_0_16px_rgba(52,211,153,0.18)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Active</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-white/50 mt-1.5 font-normal">
              High-resolution activity intelligence: visitor flows, prompt conversions, preview plays, and keyword demand.
            </p>
          </div>

          {/* Action Tools & Timeframe Chips */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Timeframe Chips (Gallery Pill Style) */}
            <div className="flex items-center p-1 rounded-full bg-white/[0.04] border border-white/10 border-t-white/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] backdrop-blur-md">
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
                  className={`relative px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
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
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-white/70 hover:text-white border border-white/10 border-t-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-white" : ""}`} />
            </button>

            {/* Export CSV Pill */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white/85 hover:text-white text-xs font-medium border border-white/10 border-t-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all cursor-pointer active:scale-95"
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
        <div className="group relative p-5 rounded-[22px] bg-gradient-to-b from-[#141419]/90 via-[#0e0e13]/95 to-[#08080b]/98 border border-white/10 border-t-white/25 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-white/20 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/30 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium tracking-wide uppercase text-white/45">Visitors</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_14px_rgba(168,85,247,0.15)]">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
            {formatNumber(stats.uniqueVisitors)}
          </div>
          <div className="text-[10.5px] text-white/40 flex items-center gap-1 font-medium truncate">
            <span className="text-purple-400 font-semibold">{deviceStats.devicePcts.Desktop}%</span>
            <span>desktop</span>
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
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        {[
          { id: "overview", label: "Top Templates Leaderboard", icon: Flame },
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

      {/* ── Tab 2: Search Intelligence ── */}
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

                return (
                  <div
                    key={ev.id || `${ev.created_at}_${Math.random()}`}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/15 transition-all text-xs"
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
                          <span className="text-white/60 font-mono">{ev.user_email || "Anonymous Visitor"}</span>
                          <span>•</span>
                          <span>{ev.metadata?.device || "Desktop"} ({ev.metadata?.browser || "Browser"})</span>
                          <span>•</span>
                          <span className="text-white/40">{ev.path}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right ml-4">
                      <span className="text-[11px] font-mono text-white/40">
                        {formatRelativeTime(ev.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
}
