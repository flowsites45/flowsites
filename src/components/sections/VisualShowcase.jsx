import React from "react"
import { motion } from "framer-motion"
import { SectionReveal, RevealItem } from "../SectionReveal"

const showcaseItems = [
  { name: "Modern Hero Sections", gradient: "from-blush/40 to-blush/10", span: "md:col-span-2 md:row-span-2" },
  { name: "Animated Pricing Tables", gradient: "from-sage/40 to-sage/10", span: "md:col-span-1 md:row-span-1" },
  { name: "Interactive Feature Cards", gradient: "from-dusty-blue/40 to-dusty-blue/10", span: "md:col-span-1 md:row-span-1" },
  { name: "Glassmorphism Dashboards", gradient: "from-lavender/40 to-lavender/10", span: "md:col-span-1 md:row-span-2" },
  { name: "Bento Layouts", gradient: "from-sage/30 to-blush/10", span: "md:col-span-1 md:row-span-1" },
  { name: "Scrolling Storytelling", gradient: "from-dusty-blue/30 to-lavender/10", span: "md:col-span-1 md:row-span-1" },
  { name: "Luxury Typography", gradient: "from-blush/30 to-lavender/10", span: "md:col-span-1 md:row-span-1" },
  { name: "Premium Gradients", gradient: "from-lavender/30 to-sage/10", span: "md:col-span-1 md:row-span-1" },
  { name: "Smooth Micro-Interactions", gradient: "from-sage/40 to-dusty-blue/10", span: "md:col-span-2 md:row-span-1" },
  { name: "Responsive Experiences", gradient: "from-dusty-blue/40 to-blush/10", span: "md:col-span-1 md:row-span-1" },
]

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: i * 0.07,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
}

export function VisualShowcase() {
  return (
    <section className="section-padding paper-texture bg-warm-white relative overflow-hidden">
      {/* Subtle decorative background blur */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-blush/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-lavender/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <SectionReveal className="text-center mb-16">
          <RevealItem>
            <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase font-body">
              Visual Showcase
            </span>
          </RevealItem>
          <RevealItem>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-foreground mt-4">
              Every Prompt Generates
              <br />
              <em>Beautiful Interfaces</em>
            </h2>
          </RevealItem>
        </SectionReveal>

        {/* Bento Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {showcaseItems.map((item, i) => (
            <motion.div
              key={item.name}
              className={`glass-card-light rounded-2xl p-6 bg-gradient-to-br ${item.gradient} flex items-end min-h-[140px] ${item.span}`}
              variants={cardVariants}
              custom={i}
              whileHover={{
                transition: { duration: 0.3, ease: "easeOut" },
              }}
            >
              <h3 className="font-display text-xl md:text-2xl text-foreground leading-snug">
                {item.name}
              </h3>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom text */}
        <SectionReveal className="text-center mt-16" delay={0.3}>
          <RevealItem>
            <p className="text-lg md:text-xl text-muted-foreground font-body leading-relaxed max-w-2xl mx-auto">
              Everything designed to impress from the very first scroll.
            </p>
          </RevealItem>
        </SectionReveal>
      </div>
    </section>
  )
}
