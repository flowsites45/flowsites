import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "./components/ui/button"
import { 
  Search, 
  Copy, 
  Wand2, 
  Check, 
  Sparkles,
  MonitorSmartphone,
  MousePointerClick,
  Code2
} from "lucide-react"
import { supabase } from "./lib/supabase.js"

import Pricing from "./components/sections/Pricing"
import PricingPage from "./components/sections/PricingPage"
import FAQ from "./components/sections/FAQ"
import CTAAndFooter from "./components/sections/CTAAndFooter"
import Overlays from "./components/sections/Overlays"
import Gallery from "./components/sections/Gallery"
import Admin from "./components/sections/Admin"
import AdminAuth from "./components/sections/AdminAuth"
import PremiumCursor from "./components/PremiumCursor"
import Auth from "./components/Auth"
import { staggerContainer, fadeSlideUp, elasticButton } from "./lib/animations"

const glassCard = "bg-gradient-to-b from-white/70 to-white/50 border border-white/60 shadow-[0_20px_60px_-15px_rgba(45,45,74,0.12),0_8px_24px_-8px_rgba(45,45,74,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9),inset_0_-1px_0_0_rgba(255,255,255,0.2)] rounded-[2rem] relative overflow-hidden";
const glassPill = "bg-gradient-to-b from-white/70 to-white/50 border border-white/60 shadow-[0_8px_24px_-6px_rgba(45,45,74,0.1),inset_0_1px_0_0_rgba(255,255,255,0.9)] rounded-full text-foreground/90 px-5 py-2 relative overflow-hidden";
const glassIcon = "bg-gradient-to-b from-white/90 to-white/60 border border-white/90 shadow-[0_8px_20px_-6px_rgba(45,45,74,0.12),inset_0_1px_0_0_rgba(255,255,255,1)]";
const glassChip = "bg-gradient-to-b from-white/80 to-white/50 border border-white/70 shadow-[0_6px_16px_-4px_rgba(45,45,74,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] rounded-full";
const glassSheen = "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent";

const slugToView = (slug) => {
  if (slug === "/gallery") return "gallery";
  if (slug === "/pricing") return "pricing";
  if (slug === "/admin") return "admin-auth";
  if (slug === "/auth") return "auth";
  return "landing";
};

const viewToSlug = (view) => {
  if (view === "gallery") return "/gallery";
  if (view === "pricing") return "/pricing";
  if (view === "admin" || view === "admin-auth") return "/admin";
  if (view === "auth") return "/auth";
  return "/";
};

export default function App() {
  const [view, setView] = useState(() => {
    const saved = localStorage.getItem("flowsites_view");
    const path = window.location.pathname;
    return slugToView(path);
  })
  const [session, setSession] = useState(null)
  const [pendingCopyTemplateId, setPendingCopyTemplateId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  function handleAuthSuccess() {
    setView("gallery");
    // pendingCopyTemplateId is already set — Gallery will auto-copy on mount
  }

  function handleAuthRequired(templateId) {
    setPendingCopyTemplateId(templateId);
    setView("auth");
  }

  useEffect(() => {
    localStorage.setItem("flowsites_view", view);
    const slug = viewToSlug(view);
    if (window.location.pathname !== slug) {
      window.history.pushState({ view }, "", slug);
    }
  }, [view])

  useEffect(() => {
    const onPopState = (e) => {
      const view = slugToView(window.location.pathname);
      setView(view);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [])

  if (view === "auth") {
    if (session) {
      setView("gallery");
      return null;
    }
    return (
      <>
        <Auth onBack={() => setView("landing")} onSuccess={handleAuthSuccess} />
        <PremiumCursor />
      </>
    )
  }

  if (view === "gallery") {
    return (
      <>
        <Gallery 
          onAdminAuth={() => setView("admin-auth")} 
          onHome={() => setView("landing")} 
          session={session}
          onAuthRequired={handleAuthRequired}
          pendingCopyTemplateId={pendingCopyTemplateId}
          onClearPendingCopy={() => setPendingCopyTemplateId(null)}
        />
        <PremiumCursor />
      </>
    )
  }

  if (view === "pricing") {
    return (
      <>
        <PricingPage
          onHome={() => setView("landing")}
          onGallery={() => setView("gallery")}
          onGetStarted={() => setView("auth")}
        />
        <PremiumCursor />
      </>
    )
  }

  if (view === "admin-auth") {
    if (session) {
      setView("admin");
      return null;
    }
    return (
      <>
        <AdminAuth
          onSuccess={() => setView("admin")}
          onBack={() => setView("gallery")}
        />
        <PremiumCursor />
      </>
    )
  }

  if (view === "admin") {
    if (!session) {
      setView("admin-auth");
      return null;
    }
    return (
      <>
        <Admin onBack={() => setView("gallery")} onViewGallery={() => setView("gallery")} onLogout={async () => { await supabase.auth.signOut(); setView("gallery"); }} />
        <PremiumCursor />
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-x-hidden selection:bg-primary/20">
      
      {/* HERO WRAPPER - UNTOUCHED */}
      <div className="relative w-full min-h-screen flex flex-col overflow-hidden">
        {/* Absolute Background for Hero */}
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          {/* Background Liquid Glow Blobs */}
          <div className="absolute top-[10%] left-[5%] w-[450px] h-[450px] rounded-full bg-accent/20 blur-[130px]" />
          <div className="absolute bottom-[-10%] right-[10%] w-[550px] h-[550px] rounded-full bg-indigo-500/15 blur-[140px]" />
          <div className="absolute top-[40%] right-[20%] w-[350px] h-[350px] rounded-full bg-pink-500/10 blur-[110px]" />
        </div>
        
        {/* Floating Glass Navbar Capsule */}
        <div className="px-6 md:px-12 lg:px-20 py-4 relative z-50">
          <nav className="grid grid-cols-2 md:grid-cols-3 items-center px-6 py-3.5 bg-white/[0.12] backdrop-blur-xl border border-white/[0.18] border-t-white/[0.35] shadow-[0_12px_40px_0_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.25)] rounded-full font-body">
            {/* Left: Logo */}
            <div className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-1.5 justify-self-start">
              <span>✦ Flowsites</span>
            </div>

            {/* Center (hidden on mobile): Nav Links */}
            <div className="hidden md:flex items-center justify-center gap-8 text-sm font-medium text-muted-foreground justify-self-center">
              <button onClick={() => setView("gallery")} className="hover:text-foreground transition-colors">Browse</button>
              <a href="#" className="hover:text-foreground transition-colors">Features</a>
              <button onClick={() => setView("pricing")} className="hover:text-foreground transition-colors">Pricing</button>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>

            {/* Right: Auth Buttons */}
            <div className="flex items-center gap-3 justify-self-end">
              <Button variant="ghost" onClick={() => setView("auth")} className="rounded-full px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
                Login
              </Button>
              <Button onClick={() => setView("auth")} className="rounded-full px-5 text-sm font-medium bg-gradient-to-b from-primary to-primary/90 hover:from-primary hover:to-primary/80 text-primary-foreground border border-primary-foreground/20 border-t-primary-foreground/40 shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-colors">
                Get Started
              </Button>
            </div>
          </nav>
        </div>

        {/* HERO SECTION */}
        <section className="relative z-10 flex-1 flex flex-col items-center justify-center w-full py-16">
          <div className="flex flex-col items-center w-full px-6 text-center -mt-16 md:-mt-24">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 border-t-white/40 bg-gradient-to-b from-white/25 to-white/10 px-4 py-1.5 text-sm text-foreground font-body mb-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
            >
              <span className="font-medium text-[13px]">✨ 30+ Premium AI Website Prompts • New Designs Every Week</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-5xl md:text-6xl lg:text-[5rem] leading-[0.95] tracking-tight text-foreground max-w-xl"
            >
              The Art of AI Design.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 text-base md:text-lg text-muted-foreground max-w-[650px] leading-relaxed font-body"
            >
              Build beautiful sites in minutes with our ready-to-use prompts. Just copy, paste, and launch.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-5 flex items-center gap-3"
            >
              <Button onClick={() => setView("gallery")} className="rounded-full px-6 py-5 text-sm font-medium font-body h-auto bg-gradient-to-b from-primary to-primary/90 hover:from-primary hover:to-primary/80 text-primary-foreground border border-primary-foreground/20 border-t-primary-foreground/40 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-colors duration-300 hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.3)]">
                Explore Templates
              </Button>
            </motion.div>
          </div>
        </section>
      </div>

      <div className="relative z-10 flex flex-col items-center pb-24 w-full bg-[#f5f2ee] cosmic-grain">
        
        {/* Soft Pastel Ambient Lighting Blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden mix-blend-multiply opacity-60" style={{ contain: "layout style paint" }}>
          <div className="absolute top-[5%] left-[5%] w-[600px] h-[600px] rounded-full bg-[#e8d5f0] blur-[140px]" />
          <div className="absolute top-[25%] right-[5%] w-[500px] h-[500px] rounded-full bg-[#d5f0e8] blur-[130px]" />
          <div className="absolute top-[45%] left-[15%] w-[700px] h-[700px] rounded-full bg-[#d4e4f0] blur-[150px]" />
          <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#f0e0d4] blur-[140px]" />
          <div className="absolute bottom-[5%] left-[20%] w-[500px] h-[500px] rounded-full bg-[#f0dce0] blur-[130px]" />
        </div>

        {/* 1. LOGO CLOUD / INTEGRATIONS */}
        <section className="w-full max-w-6xl mx-auto px-6 py-16 text-center">
          <motion.p 
            variants={fadeSlideUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
            className="text-sm font-medium text-muted-foreground mb-6 font-body uppercase tracking-widest"
          >
            Built for Modern AI Development. Works seamlessly with
          </motion.p>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="flex flex-wrap justify-center gap-3 md:gap-4">
            {["Claude Code", "Antigravity", "Codex", "Cursor", "Lovable", "Bolt", "Windsurf", "Replit"].map((tool) => (
              <motion.div 
                key={tool}
                variants={fadeSlideUp}
                whileHover={elasticButton.hover}
                whileTap={elasticButton.tap}
                className={`${glassPill} text-sm md:text-base font-medium cursor-default`}
              >
                <div className={glassSheen} />
                {tool}
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* 2. HOW IT WORKS */}
        <section className="w-full max-w-6xl mx-auto px-6 py-24">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="text-center mb-16">
            <motion.h2 variants={fadeSlideUp} className="font-display text-4xl md:text-5xl text-foreground mb-4">How It Works</motion.h2>
            <motion.p variants={fadeSlideUp} className="text-muted-foreground text-lg font-body max-w-2xl mx-auto">Design Like a Pro in Three Simple Steps</motion.p>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: Search, title: "1. Browse", desc: "Discover hundreds of professionally engineered website prompts across dozens of industries and design styles." },
              { icon: Copy, title: "2. Copy", desc: "Copy a prompt with one click. Every prompt includes layout, animations, colors, typography, and UX instructions." },
              { icon: Wand2, title: "3. Generate", desc: "Paste it into your favorite AI coding assistant and instantly generate a polished website ready to customize and launch." }
            ].map((step) => (
              <motion.div 
                key={step.title}
                variants={fadeSlideUp}
                whileHover={{ transition: { type: "spring", stiffness: 200, damping: 20 } }}
                className={`${glassCard} p-8 flex flex-col items-center text-center`}
              >
                <div className={glassSheen} />
                <div className={`w-16 h-16 rounded-2xl ${glassIcon} flex items-center justify-center mb-6`}>
                  <step.icon className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* 3. WHY CHOOSE US */}
        <section className="w-full max-w-6xl mx-auto px-6 py-24">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className={`w-full ${glassCard} p-8 md:p-16 flex flex-col md:flex-row gap-12 items-center`}>
            <div className={glassSheen} />
            <div className="flex-1">
              <motion.h2 variants={fadeSlideUp} className="font-display text-4xl md:text-5xl text-foreground mb-4">More Than Templates.</motion.h2>
              <motion.h3 variants={fadeSlideUp} className="text-xl font-body font-semibold text-foreground/80 mb-6">We Build Design Intelligence.</motion.h3>
              <motion.p variants={fadeSlideUp} className="text-muted-foreground font-body text-base leading-relaxed mb-4">
                Anyone can copy a template.
              </motion.p>
              <motion.p variants={fadeSlideUp} className="text-muted-foreground font-body text-base leading-relaxed mb-6">
                Great websites come from thoughtful layouts, clear hierarchy, beautiful motion, and exceptional user experience.
                Every prompt is carefully engineered by designers to help AI generate websites that feel handcrafted—not generic.
              </motion.p>
            </div>
            <motion.div variants={staggerContainer} className="flex-1 w-full space-y-3">
              {[
                "Pixel-perfect layouts",
                "Interactive Motions",
                "Premium animations",
                "Modern SaaS aesthetics",
                "Production-ready code structure"
              ].map((feature) => (
                <motion.div 
                  key={feature}
                  variants={fadeSlideUp}
                  className="flex items-center gap-4 bg-gradient-to-b from-white/70 to-white/40 border border-white/70 rounded-2xl p-4 shadow-[0_8px_24px_-8px_rgba(45,45,74,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)]"
                >
                  <div className={`w-9 h-9 rounded-xl ${glassIcon} flex items-center justify-center`}>
                    <Check className="w-4 h-4 text-[#5e9e8f]" />
                  </div>
                  <span className="font-body font-medium text-foreground">{feature}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* 4. WEBSITE CATEGORIES */}
        <section className="w-full max-w-6xl mx-auto px-6 py-24 text-center">
          <motion.h2 variants={fadeSlideUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="font-display text-4xl md:text-5xl text-foreground mb-4">Build Any Type of Website</motion.h2>
          <motion.p variants={fadeSlideUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="text-muted-foreground text-lg font-body max-w-2xl mx-auto mb-12">Whether you're launching a Business or building for clients, we've got prompts designed for every niche.</motion.p>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="flex flex-wrap justify-center gap-3">
            {[
              "Agencies", "SaaS", "Ecommerce", "Portfolios", "Healthcare", 
              "Real Estate", "Restaurants", "Personal Brands", "Beauty", 
              "Home Services", "Fintech", "And more...."
            ].map((category) => (
              <motion.div 
                key={category}
                variants={fadeSlideUp}
                whileHover={elasticButton.hover}
                whileTap={elasticButton.tap}
                className={`${glassChip} px-6 py-3 text-foreground/90 font-medium font-body text-sm md:text-base cursor-pointer transition-colors hover:from-white/80 hover:to-white/50`}
              >
                {category}
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* 5 & 6. VISUAL SHOWCASE & MOTION LIBRARY */}
        <section className="w-full max-w-6xl mx-auto px-6 py-24">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="grid md:grid-cols-2 gap-8 md:gap-12">
            
            <motion.div 
              variants={fadeSlideUp}
              className={`${glassCard} p-8 md:p-12`}
            >
              <div className={glassSheen} />
              <div className={`w-14 h-14 rounded-2xl ${glassIcon} flex items-center justify-center mb-6`}>
                <MonitorSmartphone className="w-7 h-7 text-foreground" />
              </div>
              <h2 className="font-display text-3xl text-foreground mb-2">Visual Showcase</h2>
              <p className="text-muted-foreground font-body mb-8 text-sm md:text-base">Every Prompt Generates Beautiful Interfaces designed to impress from the very first scroll.</p>
              
              <motion.ul variants={staggerContainer} initial="hidden" whileInView="show" className="space-y-3">
                {[
                  "Modern hero sections.", "Animated pricing tables.", "Interactive feature cards.",
                  "Glassmorphism dashboards.", "Bento layouts.", "Scrolling storytelling.",
                  "Luxury typography.", "Premium gradients.", "Smooth micro-interactions.",
                  "Responsive experiences."
                ].map((item, i) => (
                  <motion.li key={i} variants={fadeSlideUp} className="flex items-center gap-3 text-foreground/80 font-body text-sm md:text-base">
                    <Sparkles className="w-4 h-4 text-[#9aaae0] flex-shrink-0" />
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            <motion.div 
              variants={fadeSlideUp}
              className={`${glassCard} p-8 md:p-12`}
            >
              <div className={glassSheen} />
              <div className={`w-14 h-14 rounded-2xl ${glassIcon} flex items-center justify-center mb-6`}>
                <MousePointerClick className="w-7 h-7 text-foreground" />
              </div>
              <h2 className="font-display text-3xl text-foreground mb-2">Motion Library</h2>
              <p className="text-muted-foreground font-body mb-8 text-sm md:text-base">Bring Your Website to Life. Beautiful motion separates average sites from unforgettable experiences.</p>
              
              <motion.div variants={staggerContainer} initial="hidden" whileInView="show" className="flex flex-wrap gap-2">
                {[
                  "Scroll reveals", "Parallax effects", "Floating elements", "Animated gradients",
                  "Magnetic buttons", "Cursor interactions", "Glass reflections", "Mouse tracking",
                  "Card hover effects", "Page transitions", "Loading animations", "3D transforms",
                  "Background particles", "Interactive sections"
                ].map((item, i) => (
                  <motion.span key={i} variants={fadeSlideUp} whileHover={elasticButton.hover} className={`cursor-default text-xs md:text-sm font-medium ${glassChip} px-3 py-1.5 text-foreground/80 transition-colors hover:from-white/80 hover:to-white/50`}>
                    {item}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>

          </motion.div>
        </section>

        {/* 7. PREMIUM COMPONENTS */}
        <section className="w-full max-w-6xl mx-auto px-6 py-24 text-center">
          <motion.h2 variants={fadeSlideUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="font-display text-4xl md:text-5xl text-foreground mb-4">Premium Components</motion.h2>
          <motion.p variants={fadeSlideUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="text-muted-foreground text-lg font-body max-w-2xl mx-auto mb-12">Copy Individual Sections. Need only a pricing section? Or a hero? Browse hundreds of standalone components.</motion.p>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="flex flex-wrap justify-center gap-3">
            {[
              "Hero Sections", "Features", "Pricing Tables", "Testimonials", "FAQs", 
              "Footers", "Contact Forms", "Navigation", "Dashboards", "CTAs", 
              "Waitlists", "Blog Layouts", "Stats Sections", "Logos", "Timelines", 
              "Integrations", "And much more."
            ].map((comp, i) => (
              <motion.div 
                key={i}
                variants={fadeSlideUp}
                whileHover={elasticButton.hover}
                whileTap={elasticButton.tap}
                className={`${glassPill} text-sm md:text-base cursor-default`}
              >
                <div className={glassSheen} />
                {comp}
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* 8. MODERN AI COMPATIBILITY & WHO IT'S FOR */}
        <section className="w-full max-w-6xl mx-auto px-6 py-24">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="grid md:grid-cols-2 gap-8 md:gap-12">
            
            <motion.div variants={fadeSlideUp} className={`${glassCard} p-8 md:p-16 flex flex-col justify-center`}>
              <div className={glassSheen} />
              <div className={`w-14 h-14 rounded-2xl ${glassIcon} flex items-center justify-center mb-6`}>
                <Code2 className="w-7 h-7 text-foreground" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-6">Built for Modern AI Development</h2>
              <p className="text-muted-foreground font-body mb-8 text-base md:text-lg leading-relaxed">
                No outdated templates.<br/>
                No unnecessary complexity.<br/>
                Just prompts built specifically for modern AI coding workflows.
              </p>
              <div className="space-y-4">
                <p className="font-semibold text-foreground font-body">Compatible with:</p>
                <div className="flex flex-wrap gap-2">
                  {["React", "Next.js", "Tailwind CSS", "Framer Motion", "Shadcn UI", "Cursor", "Claude Code", "Codex", "Lovable", "Bolt"].map(tech => (
                    <motion.span key={tech} whileHover={elasticButton.hover} className={`cursor-default text-sm font-medium ${glassChip} px-3 py-1.5 text-foreground/80`}>
                      {tech}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeSlideUp} className={`${glassCard} p-8 md:p-16 flex flex-col justify-center`}>
              <div className={glassSheen} />
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-6">Who It's For</h2>
              <p className="text-muted-foreground font-body mb-8 text-base md:text-lg">
                Whether you're building your first startup or your hundredth client project. Perfect for:
              </p>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                {[
                  "Founders", "Freelancers", "Web Designers", "Developers",
                  "Agencies", "Product Designers", "Marketing Teams", "Students", "Creators"
                ].map((role, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-foreground/90 font-body">
                    <div className={`w-7 h-7 rounded-lg ${glassIcon} flex items-center justify-center flex-shrink-0`}>
                      <Check className="w-3.5 h-3.5 text-[#9a7eb8]" />
                    </div>
                    <span className="font-medium text-sm md:text-base capitalize">{role}</span>
                  </div>
                ))}
              </div>
            </motion.div>

          </motion.div>
        </section>

        <Pricing />
        <FAQ />
      </div>

      <CTAAndFooter />
      <Overlays />
      <PremiumCursor />
    </div>
  )
}
