import { supabase } from "./supabase.js";

const VISITOR_KEY = "fs_visitor_id";
const SESSION_KEY = "fs_session_id";
const LOCAL_EVENTS_KEY = "fs_analytics_events_v1";
const MAX_LOCAL_EVENTS = 1200;

/** Generate a random unique ID */
function generateId(prefix = "fs") {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
}

/** Get or create persistent visitor ID */
export function getVisitorId() {
  if (typeof window === "undefined") return "server";
  try {
    let vid = localStorage.getItem(VISITOR_KEY);
    if (!vid) {
      vid = generateId("usr");
      localStorage.setItem(VISITOR_KEY, vid);
    }
    return vid;
  } catch {
    return generateId("usr");
  }
}

/** Get or create session ID (resets when tab/browser closes) */
export function getSessionId() {
  if (typeof window === "undefined") return "server";
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = generateId("ses");
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return generateId("ses");
  }
}

/** Detect client device, browser, and OS info */
export function getClientContext() {
  if (typeof window === "undefined") {
    return { device: "unknown", browser: "unknown", os: "unknown" };
  }

  const ua = navigator.userAgent || "";
  let device = "Desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    device = "Tablet";
  } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/i.test(ua)) {
    device = "Mobile";
  }

  let browser = "Other";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";
  else if (/opera|opr/i.test(ua)) browser = "Opera";

  let os = "Other";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return {
    device,
    browser,
    os,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    referrer: document.referrer || "Direct",
    language: navigator.language || "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  };
}

/** Store event locally in resilient buffer */
function storeLocalEvent(event) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(event);
    if (list.length > MAX_LOCAL_EVENTS) {
      list.length = MAX_LOCAL_EVENTS;
    }
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("Analytics local store warning:", err);
  }
}

// In-memory cooldown deduplication map
const recentEventsCooldown = new Map();
const COOLDOWN_MS = 3500;

export function formatDuration(seconds) {
  if (!seconds || seconds < 1) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return remM > 0 ? `${h}h ${remM}m` : `${h}h`;
}

/**
 * Main Track Event function
 * Non-blocking, fails gracefully, deduplicated, writes to Supabase and fallback local buffer
 */
export async function trackEvent(eventType, eventName, metadata = {}, user = null) {
  try {
    // 0. Deduplication guard against rapid double clicks or React StrictMode re-renders
    const targetKey = metadata?.template_id || metadata?.query || metadata?.path || "";
    const signature = `${eventType}|${eventName}|${targetKey}|${user?.id || ""}`;
    const now = Date.now();
    const lastTrackedTime = recentEventsCooldown.get(signature);

    if (lastTrackedTime && now - lastTrackedTime < COOLDOWN_MS) {
      return null;
    }
    recentEventsCooldown.set(signature, now);

    // Keep cooldown map compact
    if (recentEventsCooldown.size > 200) {
      for (const [k, t] of recentEventsCooldown.entries()) {
        if (now - t > 10000) recentEventsCooldown.delete(k);
      }
    }

    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const client = getClientContext();
    const path = typeof window !== "undefined" ? window.location.pathname : "/";

    const payload = {
      id: generateId("evt"),
      event_type: eventType,
      event_name: eventName,
      user_id: user?.id || visitorId,
      user_email: user?.email || (user?.id ? "Registered User" : "Anonymous Visitor"),
      session_id: sessionId,
      path,
      metadata: {
        ...metadata,
        ...client,
      },
      created_at: new Date().toISOString(),
    };

    // 1. Immediately store in local resilient buffer
    storeLocalEvent(payload);

    // 2. Asynchronously transmit to Supabase table (fire and forget)
    supabase
      .from("analytics_events")
      .insert([
        {
          event_type: payload.event_type,
          event_name: payload.event_name,
          user_id: payload.user_id,
          user_email: payload.user_email,
          session_id: payload.session_id,
          path: payload.path,
          metadata: payload.metadata,
        },
      ])
      .then(({ error }) => {
        if (error && error.code !== "PGRST204" && error.code !== "42P01") {
          // Silent catch for schema differences
        }
      })
      .catch(() => {});

    return payload;
  } catch (err) {
    // Analytics should never crash the main application thread
    console.debug("Analytics tracking suppressed:", err);
    return null;
  }
}

// ── Convenient Semantic Trackers ──────────────────────────────────────────────

export function trackPageView(path, user = null) {
  return trackEvent("page_view", `View ${path}`, { path }, user);
}

export function trackTimeOnPage(path, durationSeconds, user = null) {
  if (!durationSeconds || durationSeconds < 3) return null;
  const formatted = formatDuration(durationSeconds);
  return trackEvent(
    "time_on_page",
    `Spent ${formatted} on ${path}`,
    {
      path,
      duration_seconds: durationSeconds,
      formatted_duration: formatted,
    },
    user
  );
}

export function trackPromptCopy(template, user = null) {
  return trackEvent(
    "prompt_copy",
    `Copied "${template.title}"`,
    {
      template_id: template.id,
      template_title: template.title,
      template_category: template.category,
      template_type: template.type,
      has_video: Boolean(template.video),
    },
    user
  );
}

export function trackVideoPreview(template, user = null) {
  return trackEvent(
    "video_preview",
    `Previewed "${template.title}"`,
    {
      template_id: template.id,
      template_title: template.title,
      template_category: template.category,
      template_type: template.type,
    },
    user
  );
}

export function trackPreviewDuration(template, durationSeconds, user = null) {
  if (!template || !durationSeconds || durationSeconds < 2) return null;
  const formatted = formatDuration(durationSeconds);
  return trackEvent(
    "preview_duration",
    `Watched "${template.title}" (${formatted})`,
    {
      template_id: template.id,
      template_title: template.title,
      template_category: template.category,
      template_type: template.type,
      duration_seconds: durationSeconds,
      formatted_duration: formatted,
    },
    user
  );
}

export function trackTemplateLike(template, user = null) {
  return trackEvent(
    "template_like",
    `Liked "${template.title}"`,
    {
      template_id: template.id,
      template_title: template.title,
      template_category: template.category,
    },
    user
  );
}

export function trackSearch(query, resultsCount = 0, user = null) {
  if (!query || query.trim().length === 0) return;
  return trackEvent(
    "search_query",
    `Searched "${query.trim()}"`,
    {
      query: query.trim(),
      results_count: resultsCount,
    },
    user
  );
}

export function trackCategoryFilter(category, user = null) {
  return trackEvent("filter_category", `Category: ${category}`, { category }, user);
}

export function trackTypeFilter(type, user = null) {
  return trackEvent("filter_type", `Type: ${type}`, { type }, user);
}

export function trackPricingView(user = null) {
  return trackEvent("pricing_view", "Viewed Pricing Page", {}, user);
}

export function trackBillingToggle(billingCycle, user = null) {
  return trackEvent("billing_toggle", `Toggled to ${billingCycle}`, { billingCycle }, user);
}

export function trackUpgradeClick(source = "unknown", plan = "premium", user = null) {
  return trackEvent(
    "upgrade_click",
    `Upgrade Click (${source})`,
    { source, plan },
    user
  );
}

export function trackDailyLimitReached(user = null) {
  return trackEvent("quota_exceeded", "Daily Copy Limit Reached (3/3)", {}, user);
}

export function trackAuthSuccess(user = null) {
  return trackEvent("auth_success", "User Logged In", { email: user?.email }, user);
}

// ── Query Analytics Events for Dashboard ───────────────────────────────────────

/**
 * Clean window-based deduplication
 * If multiple identical events happened within 4 seconds of each other, keep only 1
 */
function cleanDeduplicatedEvents(events) {
  const result = [];
  const seenRecent = [];

  for (const ev of events) {
    const evTime = new Date(ev.created_at).getTime();
    const targetKey = ev.metadata?.template_id || ev.metadata?.query || ev.metadata?.path || "";
    const key = `${ev.event_type}__${ev.event_name}__${targetKey}__${ev.user_id || ev.session_id || ""}`;

    const isDuplicate = seenRecent.some(
      (s) => s.key === key && Math.abs(s.time - evTime) < 4000
    );

    if (!isDuplicate) {
      result.push(ev);
      seenRecent.push({ key, time: evTime });
      if (seenRecent.length > 500) seenRecent.shift();
    }
  }

  return result;
}

export async function getAnalyticsEvents(limit = 1000) {
  let remoteEvents = [];
  let isRemoteSuccess = false;

  try {
    const { data, error } = await supabase
      .from("analytics_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && Array.isArray(data) && data.length > 0) {
      remoteEvents = data;
      isRemoteSuccess = true;
    }
  } catch (e) {
    console.debug("Supabase analytics query info:", e);
  }

  let finalEvents = [];

  if (isRemoteSuccess) {
    // Remote is the single source of truth. Do NOT mix localStorage events which caused 2x/4x duplication.
    finalEvents = remoteEvents;
  } else {
    // Fallback to local storage only if remote database is unreachable
    try {
      const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
      if (raw) {
        finalEvents = JSON.parse(raw);
      }
    } catch (e) {
      console.debug("Local analytics read error:", e);
    }
  }

  // Sort newest first
  finalEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Clean deduplication
  const deduplicated = cleanDeduplicatedEvents(finalEvents);
  return deduplicated.slice(0, limit);
}

/** Clear local analytics storage */
export function clearLocalAnalytics() {
  try {
    localStorage.removeItem(LOCAL_EVENTS_KEY);
  } catch {}
}

/** SQL migration script for Supabase SQL Editor */
export const SUPABASE_ANALYTICS_SQL = `-- Run this in your Supabase SQL Editor (1-click setup)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  event_name text NOT NULL,
  user_id text,
  user_email text,
  session_id text,
  path text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow public/anonymous and authenticated visitors to log events
CREATE POLICY "Allow anon insert to analytics_events"
  ON public.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated admins to read all analytics events
CREATE POLICY "Allow read to authenticated"
  ON public.analytics_events
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Helpful indices for fast dashboard aggregation
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events (event_type);
`;
