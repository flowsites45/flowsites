import React, { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Mail, Clock, SendHorizontal, CheckCircle2, MessageSquare, ArrowUpRight } from "lucide-react"
import { Button } from "../ui/button"
import { pastelBg, glassSheen } from "../../lib/styles"
import { elasticButton, staggerContainer, fadeSlideUp } from "../../lib/animations"

export default function CTAAndFooter() {
  const [contactSubmitted, setContactSubmitted] = useState(false)
  const [contactEmail, setContactEmail] = useState("")
  const [contactMessage, setContactMessage] = useState("")

  function handleContactSubmit(e) {
    e.preventDefault()
    if (!contactEmail.trim()) return
    setContactSubmitted(true)
    setTimeout(() => {
      setContactSubmitted(false)
      setContactEmail("")
      setContactMessage("")
    }, 4000)
  }

  return (
    <>
      {/* Premium CTA Section */}
      <section className="w-full max-w-5xl mx-auto px-6 py-20 text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className={`${pastelBg} rounded-[3rem] p-12 md:p-20 relative overflow-hidden`}
        >
          <div className={glassSheen} />
          {/* Subtle glow inside the CTA */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#d4e4f0]/80 blur-[100px] pointer-events-none" 
          />
          
          <motion.div 
            variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="relative z-10 max-w-2xl mx-auto"
          >
            <motion.h2 variants={fadeSlideUp} className="font-display text-5xl md:text-6xl text-foreground mb-6 leading-[1.1]">Ready to build something beautiful?</motion.h2>
            <motion.p variants={fadeSlideUp} className="text-muted-foreground font-body text-lg mb-10">
              Join thousands of developers and designers creating stunning websites in minutes with our premium AI prompts.
            </motion.p>
            <motion.div variants={fadeSlideUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={elasticButton.hover} whileTap={elasticButton.tap} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto rounded-full px-8 py-6 text-base font-medium font-body h-auto bg-gradient-to-b from-foreground via-foreground/95 to-foreground/90 text-background border border-foreground/30 shadow-[0_14px_36px_-8px_rgba(28,25,38,0.30),0_4px_12px_-2px_rgba(28,25,38,0.18),inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all duration-300 hover:shadow-[0_20px_48px_-8px_rgba(28,25,38,0.38),0_6px_16px_-2px_rgba(28,25,38,0.22),inset_0_1px_1px_rgba(255,255,255,0.3)]">
                  Start Building Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
              <motion.div whileHover={elasticButton.hover} whileTap={elasticButton.tap} className="w-full sm:w-auto">
                <Button variant="ghost" className="w-full sm:w-auto rounded-full px-8 py-6 text-base font-medium font-body h-auto bg-gradient-to-b from-white/[0.85] via-white/[0.70] to-white/[0.55] backdrop-blur-md border border-white/80 border-t-white shadow-[0_6px_20px_-4px_rgba(28,25,38,0.08),0_1px_3px_rgba(28,25,38,0.03),inset_0_1px_1px_rgba(255,255,255,0.95)] hover:bg-white hover:shadow-[0_12px_28px_-4px_rgba(28,25,38,0.12),inset_0_1px_1px_rgba(255,255,255,1)] text-foreground transition-all duration-300">
                  View Documentation
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Dedicated Contact Us Section */}
      <section id="contact" className="w-full max-w-5xl mx-auto px-6 pb-20 relative z-10 scroll-mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`${pastelBg} rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden`}
        >
          <div className={glassSheen} />
          
          <div className="grid md:grid-cols-12 gap-8 items-center relative z-10">
            {/* Contact Info */}
            <div className="md:col-span-5 space-y-6">
              <div>
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/[0.75] backdrop-blur-md text-foreground/80 border border-white/80 border-t-white shadow-[0_2px_8px_-2px_rgba(28,25,38,0.05),inset_0_1px_1px_rgba(255,255,255,0.95)] mb-4 font-body">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-violet-500/10 text-violet-600">
                    <MessageSquare className="w-3 h-3 text-violet-600" strokeWidth={2.2} />
                  </span>
                  Contact Support
                </span>
                <h3 className="font-display text-3xl md:text-4xl text-foreground leading-tight">
                  Get in Touch
                </h3>
                <p className="text-muted-foreground font-body text-sm mt-2 leading-relaxed">
                  Have questions, feedback, or custom prompt requests? Drop us a message and we'll respond within 24 hours.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="group flex items-center gap-4 p-3.5 rounded-2xl bg-white/[0.75] backdrop-blur-md border border-white/80 border-t-white shadow-[0_4px_14px_-3px_rgba(28,25,38,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.95)] font-body hover:bg-white/[0.85] transition-all">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-violet-500/15 to-violet-500/5 border border-violet-500/20 text-violet-600 shadow-[0_2px_8px_-2px_rgba(139,92,246,0.2),inset_0_1px_1px_rgba(255,255,255,0.9)] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <Mail className="w-5 h-5 text-violet-600" strokeWidth={1.9} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground/50 font-medium tracking-wide">Email Us</p>
                    <a href="mailto:flowsites45@gmail.com" className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-violet-600 transition-colors">
                      <span>flowsites45@gmail.com</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-foreground/40 group-hover:text-violet-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" strokeWidth={2} />
                    </a>
                  </div>
                </div>

                <div className="group flex items-center gap-4 p-3.5 rounded-2xl bg-white/[0.75] backdrop-blur-md border border-white/80 border-t-white shadow-[0_4px_14px_-3px_rgba(28,25,38,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.95)] font-body hover:bg-white/[0.85] transition-all">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-amber-500/15 to-amber-500/5 border border-amber-500/20 text-amber-600 shadow-[0_2px_8px_-2px_rgba(245,158,11,0.2),inset_0_1px_1px_rgba(255,255,255,0.9)] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <Clock className="w-5 h-5 text-amber-600" strokeWidth={1.9} />
                  </div>
                  <div>
                    <p className="text-xs text-foreground/50 font-medium tracking-wide">Response Time</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <p className="font-semibold text-foreground text-sm">Under 24 Hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact Form */}
            <div className="md:col-span-7">
              <form onSubmit={handleContactSubmit} className="bg-white/[0.75] backdrop-blur-xl border border-white/85 border-t-white rounded-3xl p-6 md:p-8 shadow-[0_14px_36px_-6px_rgba(28,25,38,0.08),0_2px_6px_rgba(28,25,38,0.03),inset_0_1.5px_1px_0_rgba(255,255,255,0.95)] space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1.5 font-body uppercase tracking-wider">
                    Your Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" strokeWidth={1.8} />
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-sm bg-white/90 border border-black/[0.08] text-foreground placeholder:text-foreground/35 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.02)] focus:outline-none focus:border-violet-500/80 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15),inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all font-body"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1.5 font-body uppercase tracking-wider">
                    Message
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground/40 pointer-events-none" strokeWidth={1.8} />
                    <textarea
                      rows={3}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="How can we help you?"
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-sm bg-white/90 border border-black/[0.08] text-foreground placeholder:text-foreground/35 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.02)] focus:outline-none focus:border-violet-500/80 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15),inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all font-body resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={contactSubmitted}
                  className="w-full group flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-b from-foreground to-foreground/90 text-background text-sm font-semibold hover:bg-foreground/95 transition-all shadow-[0_8px_24px_-4px_rgba(28,25,38,0.24),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_28px_-4px_rgba(28,25,38,0.30),inset_0_1px_1px_rgba(255,255,255,0.25)] disabled:opacity-80 font-body cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                >
                  {contactSubmitted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2} /> Message Sent!
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <SendHorizontal className="w-4 h-4 text-background/90 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Elegant Footer */}
      <footer className="w-full border-t border-black/[0.06] bg-[#f5f2ee]/80 backdrop-blur-md pt-16 pb-8 px-6 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-1.5 mb-4 font-body">
              <span>✦ Flowsites</span>
            </div>
            <p className="text-sm text-foreground/60 font-body pr-4">
              Premium design intelligence for modern AI coding workflows. Build better, faster.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4 font-body text-sm">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors font-body">Features</a></li>
              <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors font-body">Pricing</a></li>
              <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors font-body">Templates</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4 font-body text-sm">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors font-body">Documentation</a></li>
              <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors font-body">Blog</a></li>
              <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors font-body">Community</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4 font-body text-sm">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors font-body">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors font-body">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between pt-8 border-t border-black/[0.06]">
          <p className="text-xs text-foreground/40 font-body">© 2026 Flowsites Inc. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <motion.div whileHover={elasticButton.hover} whileTap={elasticButton.tap} className="w-9 h-9 rounded-xl bg-gradient-to-b from-white/[0.85] to-white/[0.60] backdrop-blur-md border border-white/80 border-t-white shadow-[0_3px_10px_-2px_rgba(28,25,38,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.95)] flex items-center justify-center cursor-pointer hover:bg-white hover:shadow-[0_6px_16px_-3px_rgba(28,25,38,0.10),inset_0_1px_1px_rgba(255,255,255,1)] transition-all"></motion.div>
            <motion.div whileHover={elasticButton.hover} whileTap={elasticButton.tap} className="w-9 h-9 rounded-xl bg-gradient-to-b from-white/[0.85] to-white/[0.60] backdrop-blur-md border border-white/80 border-t-white shadow-[0_3px_10px_-2px_rgba(28,25,38,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.95)] flex items-center justify-center cursor-pointer hover:bg-white hover:shadow-[0_6px_16px_-3px_rgba(28,25,38,0.10),inset_0_1px_1px_rgba(255,255,255,1)] transition-all"></motion.div>
          </div>
        </div>
      </footer>
    </>
  )
}
