import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { glassCard, glassIcon, glassSheen } from "../../lib/styles"
import { staggerContainer, fadeSlideUp, springs } from "../../lib/animations"

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    { q: "Do I need to know how to code?", a: "Not at all. You can generate entire layouts just by copying and pasting. If you do know how to code, you'll love how clean our React output is." },
    { q: "Does this work with Next.js?", a: "Yes. All components are fully compatible with modern frameworks including Next.js, Vite, and standard Create React App setups." },
    { q: "Are the animations heavy on performance?", a: "No. We utilize Framer Motion heavily, but optimize all transitions to run hardware-accelerated. The result is fluid motion with zero layout thrashing." },
    { q: "Can I use these for client projects?", a: "Absolutely. Once you purchase a Pro license, you can generate an unlimited number of client websites without attribution." }
  ]

  return (
    <section className="w-full max-w-3xl mx-auto px-6 py-24 relative z-10">
      <motion.div 
        variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
        className="text-center mb-12"
      >
        <motion.h2 variants={fadeSlideUp} className="font-display text-4xl md:text-5xl text-foreground mb-4">Frequently Asked Questions</motion.h2>
        <motion.p variants={fadeSlideUp} className="text-muted-foreground text-lg font-body">Everything you need to know about the platform.</motion.p>
      </motion.div>

      <motion.div 
        variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
        className="space-y-4"
      >
        {faqs.map((faq, i) => (
          <motion.div 
            key={i}
            variants={fadeSlideUp}
            className={`${glassCard} overflow-hidden`}
          >
            <div className={glassSheen} />
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full p-6 flex items-center justify-between text-left focus:outline-none"
            >
              <span className="font-display text-xl text-foreground">{faq.q}</span>
              <motion.div
                animate={{ rotate: openIndex === i ? 180 : 0 }}
                transition={springs.soft}
                className={`w-9 h-9 rounded-xl ${glassIcon} flex items-center justify-center flex-shrink-0 ml-4`}
              >
                <ChevronDown className="w-4 h-4 text-foreground/60" />
              </motion.div>
            </button>

            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0, filter: "blur(5px)" }}
                  animate={{ height: "auto", opacity: 1, filter: "blur(0px)" }}
                  exit={{ height: 0, opacity: 0, filter: "blur(5px)" }}
                  transition={springs.soft}
                >
                  <div className="px-6 pb-6 pt-0 font-body text-foreground/70 leading-relaxed text-sm md:text-base border-t border-black/5 mt-2">
                    <p className="pt-4">{faq.a}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
