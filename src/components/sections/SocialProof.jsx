import React from "react"
import { motion } from "framer-motion"
import { SectionReveal, RevealItem } from "../SectionReveal"

const tools = [
  "Claude Code",
  "Antigravity",
  "Codex",
  "Cursor",
  "Lovable",
  "Bolt",
  "Windsurf",
  "Replit",
]

const pillVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.06 * i,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
}

export function SocialProof() {
  return (
    <section className="section-padding paper-texture bg-warm-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        <SectionReveal className="text-center mb-12">
          <RevealItem>
            <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase font-body">
              Built for Modern AI Development
            </span>
          </RevealItem>
          <RevealItem>
            <p className="mt-4 text-lg text-muted-foreground font-body leading-relaxed">
              Works seamlessly with
            </p>
          </RevealItem>
        </SectionReveal>

        <motion.div
          className="flex flex-wrap items-center justify-center gap-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {tools.map((tool, i) => (
            <motion.span
              key={tool}
              custom={i}
              variants={pillVariants}
              whileHover={{}}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="glass-card-light rounded-full px-5 py-2 text-sm font-medium text-foreground font-body cursor-default select-none"
            >
              {tool}
            </motion.span>
          ))}

          <motion.span
            custom={tools.length}
            variants={pillVariants}
            className="px-5 py-2 text-sm italic text-muted-foreground font-body select-none"
          >
            and more…
          </motion.span>
        </motion.div>
      </div>
    </section>
  )
}
