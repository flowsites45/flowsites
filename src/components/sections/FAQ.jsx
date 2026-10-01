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
    <section className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative z-10 overflow-hidden">
      <motion.div 
        variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
        className="text-center mb-8 sm:mb-12"
      >
        <motion.h2 variants={fadeSlideUp} className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground mb-3 sm:mb-4">Frequently Asked Questions</motion.h2>
        <motion.p variants={fadeSlideUp} className="text-muted-foreground text-sm sm:text-lg font-body">Everything you need to know about the platform.</motion.p>
      </motion.div>

      <motion.div 
        variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
        className="space-y-3 sm:space-y-4 w-full"
      >
        {faqs.map((faq, i) => (
          <motion.div 
            key={i}
            variants={fadeSlideUp}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className={`${glassCard} overflow-hidden w-full`}
          >
            <div className={glassSheen} />
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full p-4 sm:p-6 flex items-center justify-between text-left focus:outline-none cursor-pointer gap-3"
            >
              <span className="font-display text-lg sm:text-xl text-foreground leading-snug">{faq.q}</span>
              <motion.div
                animate={{ rotate: openIndex === i ? 180 : 0 }}
                transition={springs.soft}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${glassIcon} flex items-center justify-center flex-shrink-0 ml-3 sm:ml-4`}
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
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 font-body text-foreground/80 leading-relaxed text-xs sm:text-sm md:text-base border-t border-black/[0.04] mt-2">
                    <p className="pt-3 sm:pt-4">{faq.a}</p>
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
