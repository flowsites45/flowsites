import React from "react"
import { motion } from "framer-motion"
import { SectionReveal, RevealItem } from "../SectionReveal"

const componentTypes = [
  "Hero Sections",
  "Features",
  "Pricing Tables",
  "Testimonials",
  "FAQs",
  "Footers",
  "Contact Forms",
  "Navigation",
  "Dashboards",
  "CTAs",
  "Waitlists",
  "Blog Layouts",
  "Stats Sections",
  "Logos",
  "Timelines",
  "Integrations",
]

export const PremiumComponents = () => {
  return (
    <section className="section-padding paper-texture bg-warm-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <SectionReveal className="text-center mb-16">
          <RevealItem>
            <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase font-body">
              Premium Components
            </span>
          </RevealItem>
          <RevealItem>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-foreground mt-4">
              Copy Individual Sections
            </h2>
          </RevealItem>
          <RevealItem>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-body leading-relaxed">
              Need only a pricing section? Or a hero? Or testimonials? Browse
              hundreds of standalone components including:
            </p>
          </RevealItem>
        </SectionReveal>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {componentTypes.map((name, index) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.04,
                ease: "easeOut",
              }}
            >
              <div className="glass-card-light rounded-xl p-5 text-center">
                <span className="text-foreground font-body font-medium text-sm md:text-base">
                  {name}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-center mt-10 text-muted-foreground font-body text-lg italic"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          And much more.
        </motion.p>
      </div>
    </section>
  )
}
