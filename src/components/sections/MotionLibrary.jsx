import React from "react"
import { motion } from "framer-motion"
import { SectionReveal, RevealItem } from "../SectionReveal"

const motionTypes = [
  { name: "Scroll Reveals", icon: "✦" },
  { name: "Parallax Effects", icon: "◇" },
  { name: "Floating Elements", icon: "◌" },
  { name: "Animated Gradients", icon: "◎" },
  { name: "Magnetic Buttons", icon: "⊹" },
  { name: "Cursor Interactions", icon: "↗" },
  { name: "Glass Reflections", icon: "◈" },
  { name: "Mouse Tracking", icon: "⟡" },
  { name: "Card Hover Effects", icon: "▣" },
  { name: "Page Transitions", icon: "⇢" },
  { name: "Loading Animations", icon: "◐" },
  { name: "3D Transforms", icon: "⬡" },
  { name: "Background Particles", icon: "∘" },
  { name: "Interactive Sections", icon: "⊞" },
]

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: i * 0.06,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
}

export function MotionLibrary() {
  return (
    <section className="section-padding paper-texture bg-cream relative overflow-hidden">
      {/* Ambient blurs */}
      <div className="absolute top-20 right-0 w-72 h-72 bg-sage/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-72 h-72 bg-dusty-blue/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <SectionReveal className="text-center mb-16">
          <RevealItem>
            <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase font-body">
              Motion Library
            </span>
          </RevealItem>
          <RevealItem>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-foreground mt-4">
              Bring Your Website <em>to Life</em>
            </h2>
          </RevealItem>
          <RevealItem>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-body leading-relaxed">
              Beautiful motion is what separates average websites from unforgettable
              experiences. Access professionally crafted animation prompts including:
            </p>
          </RevealItem>
        </SectionReveal>

        {/* Motion cards grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {motionTypes.map((item, i) => (
            <motion.div
              key={item.name}
              className="glass-card-light rounded-xl p-5 flex items-center gap-4 group"
              variants={cardVariants}
              custom={i}
              whileHover={{
                transition: { duration: 0.25, ease: "easeOut" },
              }}
            >
              {/* Icon circle */}
              <span className="w-10 h-10 rounded-lg bg-foreground/[0.04] flex items-center justify-center text-lg shrink-0 group-hover:bg-foreground/[0.07] transition-colors duration-300">
                {item.icon}
              </span>

              <span className="font-body text-base font-medium text-foreground leading-snug">
                {item.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
