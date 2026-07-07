import React from "react"
import { motion } from "framer-motion"
import { SectionReveal, RevealItem } from "../SectionReveal"

const categories = [
  "Agencies",
  "SaaS",
  "Ecommerce",
  "Portfolios",
  "Healthcare",
  "Real Estate",
  "Restaurants",
  "Personal Brands",
  "Beauty",
  "Home Services",
  "Fintech",
]

const pillVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: 0.15 + i * 0.06,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
}

export function Categories() {
  return (
    <section className="section-padding paper-texture bg-cream relative overflow-hidden">
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <SectionReveal className="text-center mb-16 md:mb-20">
          <RevealItem>
            <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase font-body">
              Website Categories
            </span>
          </RevealItem>
          <RevealItem>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-foreground mt-4">
              Build Any Type of Website
            </h2>
          </RevealItem>
          <RevealItem>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-body leading-relaxed">
              Whether you're launching a business or building for clients,
              we've got prompts designed for every niche.
            </p>
          </RevealItem>
        </SectionReveal>

        {/* Category pills */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-5">
          {categories.map((category, index) => (
            <motion.span
              key={category}
              className="glass-card-light rounded-full px-6 py-3 text-foreground font-body text-base md:text-lg cursor-default select-none"
              custom={index}
              variants={pillVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              whileHover={{
                transition: { duration: 0.25, ease: "easeOut" },
              }}
            >
              {category}
            </motion.span>
          ))}

          {/* "And more…" pill */}
          <motion.span
            className="rounded-full px-6 py-3 text-muted-foreground font-display italic text-base md:text-lg cursor-default select-none"
            custom={categories.length}
            variants={pillVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            And more....
          </motion.span>
        </div>
      </div>
    </section>
  )
}
