import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function Overlays() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Premium loading sequence runs once
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {/* Initial Premium Loader Overlay (Covers only the non-hero part hypothetically, or fades out to reveal) */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)", transition: { duration: 1, ease: "easeInOut" } }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-16 h-16 rounded-full bg-primary/20 blur-[10px] absolute"
            />
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-foreground font-display text-2xl z-10"
            >
              ✦ Flowsites
            </motion.div>
            <div className="w-48 h-1 bg-black/5 rounded-full overflow-hidden mt-4">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-1/2 h-full bg-foreground/20 rounded-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
