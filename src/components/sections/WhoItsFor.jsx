import React from "react"
import { motion } from "framer-motion"
import { SectionReveal, RevealItem } from "../SectionReveal"

const personas = [
  "Founders",
  "Freelancers",
  "Web Designers",
  "Developers",
  "Agencies",
  "Product Designers",
  "Marketing Teams",
  "Students",
  "Creators",
]

export const WhoItsFor = () => {
  return (
    <section className="section-padding paper-texture bg-warm-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <SectionReveal className="text-center mb-16">
          <RevealItem>
            <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase font-body">
              Who It's For
            </span>
          </RevealItem>
          <RevealItem>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-foreground mt-4 max-w-4xl mx-auto">
              Whether you're building your first startup or your hundredth client project.
            </h2>
          </RevealItem>
          <RevealItem>
            <p className="mt-6 text-lg text-muted-foreground font-body leading-relaxed">
              Perfect for:
            </p>
          </RevealItem>
        </SectionReveal>

        <div className="flex flex-wrap justify-center gap-4 md:gap-5">
          {personas.map((persona, index) => (
            <motion.div
              key={persona}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.07,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="glass-card-light rounded-2xl px-8 py-5"
            >
              <span className="font-display text-xl text-foreground">
                {persona}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
