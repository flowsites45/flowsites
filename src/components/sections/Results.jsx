import React from "react"
import { motion } from "framer-motion"
import { SectionReveal, RevealItem } from "../SectionReveal"

const benefits = [
  "Reduce design time from days to minutes.",
  "Create premium websites without starting from scratch.",
  "Generate consistent UI.",
  "Prototype ideas instantly.",
  "Launch client projects faster.",
  "Spend more time building products—not designing layouts.",
]

export const Results = () => {
  return (
    <section className="section-padding paper-texture bg-cream relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        <SectionReveal className="text-center mb-16">
          <RevealItem>
            <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase font-body">
              Results
            </span>
          </RevealItem>
          <RevealItem>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-foreground mt-4">
              Build Faster. Ship Better.
            </h2>
          </RevealItem>
        </SectionReveal>

        <div className="flex flex-col items-center gap-6 md:gap-8 text-center">
          {benefits.map((benefit, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="font-body text-lg md:text-xl text-muted-foreground leading-relaxed"
            >
              {benefit}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  )
}
