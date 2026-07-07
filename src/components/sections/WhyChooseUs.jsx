import React from "react"
import { motion } from "framer-motion"
import { SectionReveal, RevealItem } from "../SectionReveal"

const checklistItems = [
  "Pixel-perfect layouts",
  "Interactive Motions",
  "Premium animations",
  "Modern SaaS aesthetics",
  "Production-ready code structure",
]

export function WhyChooseUs() {
  return (
    <section className="section-padding paper-texture bg-warm-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <SectionReveal className="text-center mb-16 md:mb-20">
          <RevealItem>
            <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase font-body">
              Why Choose Us
            </span>
          </RevealItem>
          <RevealItem>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-foreground mt-4">
              More Than Templates.
            </h2>
          </RevealItem>
          <RevealItem>
            <p className="font-display text-2xl md:text-3xl lg:text-4xl leading-[1.1] tracking-tight text-muted-foreground mt-2">
              We Build Design Intelligence.
            </p>
          </RevealItem>
        </SectionReveal>

        {/* Two-column content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left column — Editorial text */}
          <SectionReveal className="space-y-6" delay={0.15}>
            <RevealItem>
              <p className="font-display text-2xl md:text-3xl leading-snug tracking-tight text-foreground">
                Anyone can copy a template.
              </p>
            </RevealItem>
            <RevealItem>
              <p className="text-lg text-muted-foreground font-body leading-relaxed">
                Great websites come from thoughtful layouts, clear hierarchy,
                beautiful motion, and exceptional user experience.
              </p>
            </RevealItem>
            <RevealItem>
              <p className="text-lg text-muted-foreground font-body leading-relaxed">
                Every prompt is carefully engineered by designers to help AI
                generate websites that feel handcrafted—not generic.
              </p>
            </RevealItem>
          </SectionReveal>

          {/* Right column — Feature checklist card */}
          <SectionReveal delay={0.3}>
            <RevealItem>
              <div className="glass-card-light rounded-2xl p-8 md:p-10">
                <ul className="space-y-5">
                  {checklistItems.map((item, index) => (
                    <motion.li
                      key={item}
                      className="flex items-center gap-4"
                      initial={{ opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.5,
                        delay: 0.4 + index * 0.1,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sage/60 flex items-center justify-center">
                        <span className="text-foreground text-sm font-semibold leading-none">
                          ✔
                        </span>
                      </span>
                      <span className="text-foreground font-body text-base md:text-lg">
                        {item}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </RevealItem>
          </SectionReveal>
        </div>
      </div>
    </section>
  )
}
