import React from "react"
import { motion } from "framer-motion"
import { Check, X } from "lucide-react"
import { glassCard, pastelBg, glassIcon, glassSheen } from "../../lib/styles"
import { staggerContainer, fadeSlideUp, hoverCard, elasticButton } from "../../lib/animations"
import { Button } from "../ui/button"

export default function Pricing() {
  const features = ["Unlimited Projects", "Premium Components", "Custom Animations", "Priority Support", "White-label Output"]

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-24 relative z-10">
      <motion.div 
        variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
        className="text-center mb-16"
      >
        <motion.h2 variants={fadeSlideUp} className="font-display text-4xl md:text-5xl text-foreground mb-4">Simple Pricing</motion.h2>
        <motion.p variants={fadeSlideUp} className="text-muted-foreground text-lg font-body max-w-2xl mx-auto">Get access to all premium features.</motion.p>
      </motion.div>

      {/* Beautiful Pricing Cards */}
      <motion.div 
        variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
        className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-24"
      >
        {/* Starter Plan */}
        <motion.div 
          variants={fadeSlideUp}
          whileHover={hoverCard.hover}
          className={`${pastelBg} rounded-[2rem] p-10 relative overflow-hidden`}
        >
          <div className={glassSheen} />
          <h3 className="font-display text-3xl text-foreground mb-2">Starter</h3>
          <div className="font-body text-4xl font-bold text-foreground mb-6">$49<span className="text-lg text-foreground/50 font-medium">/mo</span></div>
          <ul className="space-y-4 mb-8">
            {features.slice(0, 3).map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-body text-foreground/80">
                <div className={`w-6 h-6 rounded-lg ${glassIcon} flex items-center justify-center flex-shrink-0`}>
                  <Check className="w-3.5 h-3.5 text-[#5e9e8f]" />
                </div>
                {f}
              </li>
            ))}
            {features.slice(3).map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-body text-foreground/40 line-through">
                <div className="w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center flex-shrink-0">
                  <X className="w-3.5 h-3.5 text-foreground/40" />
                </div>
                {f}
              </li>
            ))}
          </ul>
          <motion.div whileHover={elasticButton.hover} whileTap={elasticButton.tap}>
            <Button className="w-full rounded-xl py-6 bg-gradient-to-b from-white/70 to-white/50 border border-white/80 shadow-[0_8px_24px_-6px_rgba(45,45,74,0.1),inset_0_1px_0_0_rgba(255,255,255,0.9)] text-foreground hover:from-white hover:to-white/70 hover:shadow-md transition-colors font-medium font-body">
              Get Started
            </Button>
          </motion.div>
        </motion.div>

        {/* Pro Plan */}
        <motion.div 
          variants={fadeSlideUp}
          whileHover={hoverCard.hover}
          className={`${glassCard} p-10 ring-4 ring-white/40`}
        >
          <div className={glassSheen} />
          <div className="absolute top-5 right-5 bg-gradient-to-b from-[#f0dce0] to-[#f0dce0]/70 border border-white/80 shadow-[0_8px_24px_-6px_rgba(45,45,74,0.12)] rounded-full px-3 py-1 text-xs font-bold text-[#c47878]">
            Popular
          </div>
          <h3 className="font-display text-3xl text-foreground mb-2">Pro</h3>
          <div className="font-body text-4xl font-bold text-foreground mb-6">$99<span className="text-lg text-foreground/50 font-medium">/mo</span></div>
          <ul className="space-y-4 mb-8">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-body text-foreground/80">
                <div className={`w-6 h-6 rounded-lg ${glassIcon} flex items-center justify-center flex-shrink-0`}>
                  <Check className="w-3.5 h-3.5 text-[#9a7eb8]" />
                </div>
                {f}
              </li>
            ))}
          </ul>
          <motion.div whileHover={elasticButton.hover} whileTap={elasticButton.tap}>
            <Button className="w-full rounded-xl py-6 bg-foreground text-background hover:bg-foreground/90 shadow-xl transition-colors font-medium font-body">
              Go Pro
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Animated Comparison Table */}
      <motion.div 
        variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
        className={`${pastelBg} rounded-[2rem] p-8 overflow-hidden relative`}
      >
        <div className={glassSheen} />
        <motion.h3 variants={fadeSlideUp} className="font-display text-2xl text-foreground mb-8 text-center">Detailed Comparison</motion.h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body text-sm text-foreground/80">
            <thead>
              <tr className="border-b border-black/5">
                <th className="pb-4 font-semibold text-foreground/90">Feature</th>
                <th className="pb-4 font-semibold text-foreground/90 text-center w-1/4">Starter</th>
                <th className="pb-4 font-semibold text-foreground/90 text-center w-1/4">Pro</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Components", s: "Basic", p: "All Premium" },
                { name: "Updates", s: "Monthly", p: "Weekly" },
                { name: "Export options", s: "React only", p: "React, Next.js, Vue" },
                { name: "Support", s: "Community", p: "24/7 Priority" }
              ].map((row, i) => (
                <motion.tr 
                  key={i}
                  variants={fadeSlideUp}
                  className="border-b border-black/5 hover:bg-white/30 transition-colors"
                >
                  <td className="py-4 font-medium">{row.name}</td>
                  <td className="py-4 text-center">{row.s}</td>
                  <td className="py-4 text-center font-medium text-[#9a7eb8]">{row.p}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </section>
  )
}
