import React from "react"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "../ui/button"
import { pastelBg, glassSheen } from "../../lib/styles"
import { elasticButton, staggerContainer, fadeSlideUp } from "../../lib/animations"

export default function CTAAndFooter() {
  return (
    <>
      {/* Premium CTA Section */}
      <section className="w-full max-w-5xl mx-auto px-6 py-24 text-center relative z-10">
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
                <Button className="w-full sm:w-auto rounded-full px-8 py-6 text-base font-medium font-body h-auto bg-foreground hover:bg-foreground/90 text-background shadow-[0_12px_40px_-8px_rgba(45,45,74,0.25)] transition-colors">
                  Start Building Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
              <motion.div whileHover={elasticButton.hover} whileTap={elasticButton.tap} className="w-full sm:w-auto">
                <Button variant="ghost" className="w-full sm:w-auto rounded-full px-8 py-6 text-base font-medium font-body h-auto bg-gradient-to-b from-white/60 to-white/40 border border-white/70 shadow-[0_8px_24px_-6px_rgba(45,45,74,0.1),inset_0_1px_0_0_rgba(255,255,255,0.9)] hover:from-white hover:to-white/60 text-foreground transition-colors">
                  View Documentation
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Elegant Footer */}
      <footer className="w-full border-t border-black/5 bg-[#f5f2ee]/80 pt-16 pb-8 px-6 relative z-10">
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
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between pt-8 border-t border-black/5">
          <p className="text-xs text-foreground/40 font-body">© 2026 Flowsites Inc. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <motion.div whileHover={elasticButton.hover} whileTap={elasticButton.tap} className="w-9 h-9 rounded-xl bg-gradient-to-b from-white/60 to-white/30 border border-white/70 shadow-[0_6px_16px_-4px_rgba(45,45,74,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] flex items-center justify-center cursor-pointer hover:from-white hover:to-white/50 transition-colors"></motion.div>
            <motion.div whileHover={elasticButton.hover} whileTap={elasticButton.tap} className="w-9 h-9 rounded-xl bg-gradient-to-b from-white/60 to-white/30 border border-white/70 shadow-[0_6px_16px_-4px_rgba(45,45,74,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] flex items-center justify-center cursor-pointer hover:from-white hover:to-white/50 transition-colors"></motion.div>
          </div>
        </div>
      </footer>
    </>
  )
}
