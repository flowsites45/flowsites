import React from "react"
import { motion } from "framer-motion"
import { SectionReveal, RevealItem } from "../SectionReveal"

const steps = [
  {
    number: "01",
    title: "Browse",
    description:
      "Discover hundreds of professionally engineered website prompts across dozens of industries and design styles.",
  },
  {
    number: "02",
    title: "Copy",
    description:
      "Copy a prompt with one click. Every prompt includes layout, animations, colors, typography, and UX instructions.",
  },
  {
    number: "03",
    title: "Generate",
    description:
      "Paste it into your favorite AI coding assistant and instantly generate a polished website ready to customize and launch.",
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.15 * i,
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
}

export function HowItWorks() {
  return (
    <section className="section-padding paper-texture bg-cream relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <SectionReveal className="text-center mb-16">
          <RevealItem>
            <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase font-body">
              How It Works
            </span>
          </RevealItem>
          <RevealItem>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-foreground mt-4">
              Design Like a Pro in Three Simple Steps
            </h2>
          </RevealItem>
        </SectionReveal>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              custom={i}
              variants={cardVariants}
              className="glass-card-light rounded-2xl p-8 flex flex-col"
            >
              <span className="font-display text-5xl text-muted-foreground/30 leading-none select-none">
                {step.number}
              </span>

              <h3 className="font-display text-2xl md:text-3xl text-foreground mt-4">
                {step.title}
              </h3>

              <p className="mt-3 text-base text-muted-foreground font-body leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
