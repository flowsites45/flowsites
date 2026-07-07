import React from "react"
import { motion } from "framer-motion"

/* ── 3D Cosmic Sphere ────────────────────────────────────────── */
export function CosmicSphere({ size = 120, color = "#b8a6e0", className = "", glowClass = "", style = {} }) {
  return (
    <div
      className={`sphere-3d shadow-cosmic ${glowClass} ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, ${color} 0%, ${shade(color, -20)} 70%, ${shade(color, -35)} 100%)`,
        ...style,
      }}
    />
  )
}

/* ── Glassmorphic 3D Sphere ──────────────────────────────────── */
export function GlassSphere({ size = 100, color = "rgba(184, 166, 224, 0.35)", className = "", style = {} }) {
  return (
    <div
      className={`sphere-glass shadow-cosmic ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, ${color} 0%, ${color.replace(/[\d.]+\)$/, "0.15)")} 60%, ${color.replace(/[\d.]+\)$/, "0.05)")} 100%)`,
        border: "1px solid rgba(255, 255, 255, 0.5)",
        ...style,
      }}
    />
  )
}

/* ── Orbital Ring (tilted ellipse) ───────────────────────────── */
export function OrbitalRing({ size = 200, tilt = 65, className = "", style = {} }) {
  return (
    <div
      className={`orbital-ring ${className}`}
      style={{
        width: size,
        height: size,
        transform: `rotateX(${tilt}deg)`,
        ...style,
      }}
    />
  )
}

/* ── Parabolic Orbital Path SVG ──────────────────────────────── */
export function OrbitalPath({ width = 400, height = 200, className = "", style = {} }) {
  return (
    <svg
      className={className}
      style={{ position: "absolute", pointerEvents: "none", ...style }}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
    >
      <path
        d={`M 10 ${height / 2} Q ${width / 2} -${height * 0.3} ${width - 10} ${height / 2}`}
        className="orbital-path"
      />
      <path
        d={`M 10 ${height / 2} Q ${width / 2} ${height * 1.3} ${width - 10} ${height / 2}`}
        className="orbital-path"
        style={{ opacity: 0.5 }}
      />
    </svg>
  )
}

/* ── Floating 3D Object Scene ────────────────────────────────── */
/* A decorative layer of floating pastel spheres with orbital rings */
export function FloatingCosmicScene() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Large lavender sphere top-left */}
      <motion.div
        className="absolute"
        style={{ top: "8%", left: "3%" }}
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        <CosmicSphere size={140} color="#b8a6e0" glowClass="glow-lavender" />
        <OrbitalRing size={220} tilt={70} className="-top-10 -left-10" style={{ borderColor: "rgba(184, 166, 224, 0.3)" }} />
      </motion.div>

      {/* Teal sphere mid-right */}
      <motion.div
        className="absolute"
        style={{ top: "30%", right: "5%" }}
        animate={{ y: [0, 25, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      >
        <CosmicSphere size={100} color="#8fd0c8" glowClass="glow-teal" />
      </motion.div>

      {/* Peach sphere lower-left */}
      <motion.div
        className="absolute"
        style={{ bottom: "15%", left: "8%" }}
        animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        <CosmicSphere size={80} color="#f0b894" glowClass="glow-peach" />
      </motion.div>

      {/* Glass periwinkle sphere mid-left */}
      <motion.div
        className="absolute"
        style={{ top: "55%", left: "12%" }}
        animate={{ y: [0, 18, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      >
        <GlassSphere size={90} color="rgba(154, 170, 224, 0.4)" glowClass="glow-periwinkle" />
      </motion.div>

      {/* Coral sphere bottom-right */}
      <motion.div
        className="absolute"
        style={{ bottom: "10%", right: "12%" }}
        animate={{ y: [0, -22, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      >
        <CosmicSphere size={110} color="#e0918f" glowClass="glow-coral" />
        <OrbitalRing size={170} tilt={55} className="-top-8 -left-8" style={{ borderColor: "rgba(224, 145, 143, 0.3)" }} />
      </motion.div>

      {/* Small gold sphere top area */}
      <motion.div
        className="absolute"
        style={{ top: "18%", right: "20%" }}
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        <CosmicSphere size={50} color="#ddc888" glowClass="glow-gold" />
      </motion.div>

      {/* Sage sphere */}
      <motion.div
        className="absolute"
        style={{ top: "42%", right: "25%" }}
        animate={{ y: [0, -16, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      >
        <GlassSphere size={65} color="rgba(163, 192, 150, 0.35)" glowClass="glow-sage" />
      </motion.div>

      {/* Rose sphere lower area */}
      <motion.div
        className="absolute"
        style={{ bottom: "25%", right: "6%" }}
        animate={{ y: [0, 14, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      >
        <CosmicSphere size={60} color="#d8a5b8" glowClass="glow-rose" />
      </motion.div>

      {/* Orbital paths */}
      <OrbitalPath width={500} height={250} style={{ top: "20%", left: "10%", opacity: 0.4 }} />
      <OrbitalPath width={400} height={200} style={{ bottom: "20%", right: "5%", opacity: 0.3, transform: "scaleX(-1)" }} />
    </div>
  )
}

/* ── Helper: darken a hex color ──────────────────────────────── */
function shade(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16)
  const r = Math.max(0, Math.min(255, (num >> 16) + Math.round(255 * (percent / 100))))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100))))
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + Math.round(255 * (percent / 100))))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}
