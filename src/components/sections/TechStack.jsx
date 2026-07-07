import React from "react"
import { motion } from "framer-motion"
import { SectionReveal, RevealItem } from "../SectionReveal"

const techNames = [
  "React",
  "Next.js",
  "Tailwind CSS",
  "Framer Motion",
  "Shadcn UI",
  "Cursor",
  "Claude Code",
  "Codex",
  "Lovable",
  "Bolt",
]

export const TechStack = () => {
  return (
    <section className="section-padding paper-texture bg-cream relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <SectionReveal className="text-center mb-16">
          <RevealItem>
            <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase font-body">
              Tech Stack
            </span>
          </RevealItem>
          <RevealItem>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-foreground mt-4">
              Built for Modern AI Development
            </h2>
          </RevealItem>
        </SectionReveal>

        <SectionReveal className="text-center mb-16">
          <RevealItem>
            <p className="text-xl md:text-2xl text-foreground font-body font-medium leading-relaxed">
              No outdated templates.
            </p>
          </RevealItem>
          <RevealItem>
            <p className="text-xl md:text-2xl text-foreground font-body font-medium leading-relaxed mt-2">
              No unnecessary complexity.
            </p>
          </RevealItem>
          <RevealItem>
            <p className="text-xl md:text-2xl text-muted-foreground font-body leading-relaxed mt-2">
              Just prompts built specifically for modern AI coding workflows.
            </p>
          </RevealItem>
        </SectionReveal>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase font-body">
            Compatible with:
          </span>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {techNames.map((name, index) => (
              <motion.div
                key={name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
              >
                <div className="glass-card-light rounded-full px-5 py-2.5 cursor-default">
                  <span className="text-foreground font-body font-medium text-sm md:text-base whitespace-nowrap">
                    {name}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
