import { useEffect, useRef, useState } from "react"

const INTERACTIVE_SELECTOR =
  "a, button, [role='button'], input, textarea, select, label, [data-cursor], .cursor-pointer"

// Lerp factor — lower = more lag/smoothness, higher = more responsive
const LERP = 0.18

export default function PremiumCursor() {
  const [enabled, setEnabled] = useState(false)
  const dotRef = useRef(null)
  const posRef = useRef(null)

  // Target + current positions stored in refs — no React re-renders
  const target = useRef({ x: -100, y: -100 })
  const current = useRef({ x: -100, y: -100 })
  const rafId = useRef(0)
  const sizeRef = useRef(16)
  const opacityRef = useRef(1)
  const currentSize = useRef(16)
  const currentOpacity = useRef(1)

  useEffect(() => {
    const isTouch =
      window.matchMedia("(hover: none)").matches ||
      !window.matchMedia("(pointer: fine)").matches
    if (isTouch) return

    setEnabled(true)
    document.documentElement.style.cursor = "none"

    const move = (e) => {
      target.current.x = e.clientX
      target.current.y = e.clientY
    }

    const over = (e) => {
      const el = e.target.closest(INTERACTIVE_SELECTOR)
      if (!el) return
      if (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.getAttribute("data-cursor") === "text"
      ) {
        sizeRef.current = 0
        opacityRef.current = 0
      } else {
        sizeRef.current = 14
        opacityRef.current = 1
      }
    }

    const out = (e) => {
      if (!e.relatedTarget?.closest?.(INTERACTIVE_SELECTOR)) {
        sizeRef.current = 16
        opacityRef.current = 1
      }
    }

    const leave = () => { opacityRef.current = 0 }
    const enter = () => { opacityRef.current = 1 }

    window.addEventListener("mousemove", move, { passive: true })
    document.addEventListener("mouseover", over)
    document.addEventListener("mouseout", out)
    document.addEventListener("mouseleave", leave)
    document.addEventListener("mouseenter", enter)

    // High-FPS rAF loop — direct DOM manipulation, zero React overhead
    const tick = () => {
      // Lerp position for buttery easing
      current.current.x += (target.current.x - current.current.x) * LERP
      current.current.y += (target.current.y - current.current.y) * LERP

      // Lerp size & opacity for smooth transitions
      currentSize.current += (sizeRef.current - currentSize.current) * 0.2
      currentOpacity.current += (opacityRef.current - currentOpacity.current) * 0.15

      const pos = posRef.current
      const dot = dotRef.current
      if (pos && dot) {
        // translate3d forces GPU compositing layer
        pos.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`
        dot.style.width = `${currentSize.current}px`
        dot.style.height = `${currentSize.current}px`
        dot.style.opacity = `${currentOpacity.current}`
      }

      rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)

    return () => {
      document.documentElement.style.cursor = ""
      cancelAnimationFrame(rafId.current)
      window.removeEventListener("mousemove", move)
      document.removeEventListener("mouseover", over)
      document.removeEventListener("mouseout", out)
      document.removeEventListener("mouseleave", leave)
      document.removeEventListener("mouseenter", enter)
    }
  }, [])

  if (!enabled) return null

  return (
    <div className="premium-cursor-layer" aria-hidden="true">
      <div ref={posRef} className="premium-cursor-pos">
        <div ref={dotRef} className="premium-cursor-dot" />
      </div>
    </div>
  )
}
