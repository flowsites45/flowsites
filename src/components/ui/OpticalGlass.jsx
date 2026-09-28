import React, { useEffect, useRef } from "react"
import "../../styles/optical-button.css"

// Math & SDF utilities for optical glass refraction
function U(w, h, radii) {
  let r = (typeof radii === "number" ? [radii, radii, radii, radii] : radii).map((v) =>
    Number.isFinite(v) ? Math.max(0, v) : 0
  )
  if (r.every((v) => v === r[0])) {
    let maxR = Math.min(r[0], w / 2, h / 2)
    return [maxR, maxR, maxR, maxR]
  }
  let [tl, tr, br, bl] = r
  let c = Math.min(1, w / (tl + tr), w / (bl + br), h / (tl + bl), h / (tr + br))
  return [tl * c, tr * c, br * c, bl * c]
}

function W_sdf(w, h, radii) {
  let [tl, tr, br, bl] = radii
  let segs = [
    [tl, 0, w - tr, 0],
    [w, tr, w, h - br],
    [bl, h, w - br, h],
    [0, tl, 0, h - bl],
  ]
  let corners = [
    { x: tl, y: tl, r: tl, sx: -1, sy: -1 },
    { x: w - tr, y: tr, r: tr, sx: 1, sy: -1 },
    { x: w - br, y: h - br, r: br, sx: 1, sy: 1 },
    { x: bl, y: h - bl, r: bl, sx: -1, sy: 1 },
  ].filter((c) => c.r > 0)

  let res = { distance: 0, nx: 0, ny: 0 }
  return (x, y) => {
    if (x < 0 || x > w || y < 0 || y > h) return null
    for (let c of corners) {
      let dx = x - c.x,
        dy = y - c.y
      if (dx * c.sx >= 0 && dy * c.sy >= 0 && dx * dx + dy * dy > c.r * c.r) return null
    }
    let minDistSq = Infinity,
      sumX = 0,
      sumY = 0
    let check = (px, py) => {
      let dx = px - x,
        dy = py - y
      let dSq = dx * dx + dy * dy
      let eps = 1e-10 * Math.max(1, dSq, Number.isFinite(minDistSq) ? minDistSq : 0)
      if (dSq < minDistSq - eps) {
        minDistSq = dSq
        sumX = dx
        sumY = dy
      } else if (Math.abs(dSq - minDistSq) <= eps) {
        sumX += dx
        sumY += dy
      }
    }
    for (let [x1, y1, x2, y2] of segs) {
      let vx = x2 - x1,
        vy = y2 - y1
      let lenSq = vx * vx + vy * vy
      let t = lenSq > 0 ? Math.max(0, Math.min(1, ((x - x1) * vx + (y - y1) * vy) / lenSq)) : 0
      check(x1 + t * vx, y1 + t * vy)
    }
    for (let c of corners) {
      let dx = x - c.x,
        dy = y - c.y
      if (dx * c.sx < 0 || dy * c.sy < 0) continue
      let dist = Math.hypot(dx, dy)
      let nx = dist > 1e-12 ? dx / dist : c.sx * Math.SQRT1_2
      let ny = dist > 1e-12 ? dy / dist : c.sy * Math.SQRT1_2
      check(c.x + nx * c.r, c.y + ny * c.r)
    }
    res.distance = Math.sqrt(minDistSq)
    let gradNorm = Math.hypot(sumX, sumY)
    res.nx = gradNorm > 1e-12 ? sumX / gradNorm : 0
    res.ny = gradNorm > 1e-12 ? sumY / gradNorm : 0
    return res
  }
}

function generateOpticalMaps(w, h, rawRadii, rawShoulder) {
  let fallback = { displacement: "", highlight: "" }
  if (typeof document === "undefined") return fallback

  let posNum = (v, def) => (Number.isFinite(v) && v > 0 ? v : def)
  let width = posNum(w, 1)
  let height = posNum(h, 1)
  let halfW = width / 2
  let halfH = height / 2
  let radii = U(width, height, rawRadii)
  let isUniform = radii.every((r) => r === radii[0])
  let uniformR = radii[0]
  let sdf = isUniform ? null : W_sdf(width, height, radii)
  let shoulder = posNum(rawShoulder, 6)
  let h_limit = Math.min(shoulder, halfW, halfH)
  let scale = Math.min(1.5, 768 / width, 768 / height, Math.sqrt(98304 / width / height))
  let canvasW = Math.max(1, Math.floor(width * scale))
  let canvasH = Math.max(1, Math.floor(height * scale))
  let stepX = width / canvasW
  let stepY = height / canvasH
  let maxStep = Math.max(stepX, stepY)
  let clamp01 = (v) => Math.max(0, Math.min(1, v))

  try {
    let canvas = document.createElement("canvas")
    canvas.width = canvasW
    canvas.height = canvasH
    let ctx = canvas.getContext("2d")
    if (!ctx) return fallback

    let dispImg = ctx.createImageData(canvasW, canvasH)
    let highImg = ctx.createImageData(canvasW, canvasH)
    let dispData = dispImg.data
    let highData = highImg.data

    for (let y = 0; y < canvasH; y++) {
      let py = (y + 0.5) * stepY - halfH
      for (let x = 0; x < canvasW; x++) {
        let idx = (y * canvasW + x) * 4
        dispData[idx] = 128
        dispData[idx + 1] = 128
        dispData[idx + 2] = 128
        dispData[idx + 3] = 255

        let px = (x + 0.5) * stepX - halfW
        let dist, nx, ny

        if (isUniform) {
          let qx = Math.abs(px) - (halfW - uniformR)
          let qy = Math.abs(py) - (halfH - uniformR)
          let rx = Math.max(qx, 0)
          let ry = Math.max(qy, 0)
          let d = Math.hypot(rx, ry)
          dist = -(d + Math.min(Math.max(qx, qy), 0) - uniformR)
          if (dist <= 0 || dist >= h_limit) continue
          let sx = px < 0 ? -1 : 1
          let sy = py < 0 ? -1 : 1
          if (d > 1e-6) {
            nx = (rx / d) * sx
            ny = (ry / d) * sy
          } else if (qx > qy) {
            nx = sx
            ny = 0
          } else if (qy > qx) {
            nx = 0
            ny = sy
          } else {
            nx = sx * Math.SQRT1_2
            ny = sy * Math.SQRT1_2
          }
        } else {
          let s = sdf(px + halfW, py + halfH)
          if (!s || s.distance <= 0 || s.distance >= h_limit) continue
          dist = s.distance
          nx = s.nx
          ny = s.ny
        }

        let v = dist / h_limit
        let b = 0.58 * Math.sin(Math.PI * v) ** 2 * (h_limit / shoulder)
        dispData[idx] = Math.round(127.5 - 127.5 * nx * b)
        dispData[idx + 1] = Math.round(127.5 - 127.5 * ny * b)

        let dotVal = nx * -0.5547 + ny * -0.83205
        let sPos = Math.max(0, dotVal) ** 1.7
        let sNeg = Math.max(0, -dotVal) ** 1.6
        let g1 = Math.exp(-(((v - 0.16) / 0.19) ** 2))
        let g2 = Math.exp(-(((v - 0.34) / 0.34) ** 2))
        let edgeFade = clamp01(dist / maxStep + 0.5)
        let falloff = (1 - v) ** 1.2
        let ne = (0.72 * sPos * g1 - 0.14 * sNeg * g2) * falloff
        let outCol = ne >= 0 ? 255 : 0

        highData[idx] = outCol
        highData[idx + 1] = outCol
        highData[idx + 2] = outCol
        highData[idx + 3] = Math.round(255 * Math.abs(ne) * edgeFade)
      }
    }

    ctx.putImageData(dispImg, 0, 0)
    let dispUrl = canvas.toDataURL("image/png")
    ctx.putImageData(highImg, 0, 0)
    let highUrl = canvas.toDataURL("image/png")
    canvas.width = 1
    canvas.height = 1
    return { displacement: dispUrl, highlight: highUrl, width, height }
  } catch (err) {
    console.error("Failed to generate optical maps:", err)
    return fallback
  }
}

// Numerical Spring Integrator
class SpringValue {
  constructor(initial = 0, stiffness = 250, damping = 29, mass = 0.45) {
    this.value = initial
    this.target = initial
    this.velocity = 0
    this.stiffness = stiffness
    this.damping = damping
    this.mass = mass
  }

  set(target) {
    this.target = target
  }

  jump(val) {
    this.value = val
    this.target = val
    this.velocity = 0
  }

  step(dt) {
    const subSteps = 4
    const subDt = dt / subSteps
    for (let i = 0; i < subSteps; i++) {
      const springForce = -this.stiffness * (this.value - this.target)
      const dampingForce = -this.damping * this.velocity
      const accel = (springForce + dampingForce) / this.mass
      this.velocity += accel * subDt
      this.value += this.velocity * subDt
    }
    return this.value
  }

  isAtRest(tolerance = 0.0001) {
    return Math.abs(this.value - this.target) < tolerance && Math.abs(this.velocity) < tolerance
  }
}

// Optical Engine Controller
class OpticalEngine {
  constructor(el, options = {}) {
    this.el = el
    this.isNavbar = options.isNavbar || false
    this.onClick = options.onClick || null

    this.face = el.querySelector(".ml-optical-face")
    this.body = el.querySelector(".ml-optical-body")
    this.surface = el.querySelector(".ml-optical-surface")
    this.tint = el.querySelector(".ml-optical-tint")
    this.shoulder = el.querySelector(".ml-optical-shoulder")
    this.reflection = el.querySelector(".ml-optical-reflection")
    this.caustic = el.querySelector(".ml-optical-caustic")
    this.pointerLight = el.querySelector(".ml-optical-pointer-light")
    this.rim = el.querySelector(".ml-optical-rim")
    this.edgeLight = el.querySelector(".ml-optical-edge-light")
    this.counterLight = el.querySelector(".ml-optical-counter-light")

    this.normalImg = el.querySelector(".ml-optical-normal")
    if (!this.normalImg && this.surface) {
      this.normalImg = document.createElement("img")
      this.normalImg.className = "ml-optical-normal"
      this.normalImg.alt = ""
      this.normalImg.draggable = false
      this.surface.insertBefore(this.normalImg, this.reflection)
    }

    this.material = el.getAttribute("data-material") || "clear"
    this.surfaceType = el.getAttribute("data-surface") || "light"
    this.shoulderRadius = this.isNavbar ? 16 : 10
    this.baseBlur = this.material === "frosted" ? 11.5 : 2.5
    this.refraction = 0.65
    this.lightFollow = 75

    this.filterId = `optical-filter-${Math.random().toString(36).slice(2, 9)}`
    this.svgContainer = null
    this.isChromium =
      typeof navigator !== "undefined" &&
      /(?:Chrome|Chromium|Edg)\//.test(navigator.userAgent) &&
      !/iPhone|iPad|iPod/.test(navigator.userAgent) &&
      !(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)

    this.springW = new SpringValue(0, 250, 29, 0.45)
    this.springG = new SpringValue(0, 250, 29, 0.45)
    this.springK = new SpringValue(0, 125, 25, 0.65)
    this.springJ = new SpringValue(0, 420, 32, 0.6)

    this.isHovered = false
    this.isPressed = false
    this.lastTime = performance.now()
    this.animId = null
    this.ro = null

    this.initEvents()
    this.initDisplacement()
    this.startLoop()
  }

  initDisplacement() {
    const updateMaps = () => {
      if (!this.el) return
      const w = Math.round(this.el.offsetWidth)
      const h = Math.round(this.el.offsetHeight)
      if (!w || !h) return

      const style = window.getComputedStyle(this.el)
      const parseRadius = (str) => Math.max(0, parseFloat(str) || 0)
      const radii = [
        parseRadius(style.borderTopLeftRadius),
        parseRadius(style.borderTopRightRadius),
        parseRadius(style.borderBottomRightRadius),
        parseRadius(style.borderBottomLeftRadius),
      ]

      const maps = generateOpticalMaps(w, h, radii, this.shoulderRadius)
      if (maps.highlight && this.normalImg) {
        this.normalImg.src = maps.highlight
      }

      if (maps.displacement && this.isChromium) {
        if (!this.svgContainer) {
          this.svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg")
          this.svgContainer.setAttribute("aria-hidden", "true")
          this.svgContainer.setAttribute("focusable", "false")
          this.svgContainer.setAttribute("width", "0")
          this.svgContainer.setAttribute("height", "0")
          this.svgContainer.style.position = "absolute"
          this.svgContainer.style.pointerEvents = "none"

          const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")
          const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter")
          filter.setAttribute("id", this.filterId)
          filter.setAttribute("x", "0")
          filter.setAttribute("y", "0")
          filter.setAttribute("width", `${maps.width}`)
          filter.setAttribute("height", `${maps.height}`)
          filter.setAttribute("filterUnits", "userSpaceOnUse")
          filter.setAttribute("color-interpolation-filters", "sRGB")

          const feImg = document.createElementNS("http://www.w3.org/2000/svg", "feImage")
          feImg.setAttribute("href", maps.displacement)
          feImg.setAttribute("x", "0")
          feImg.setAttribute("y", "0")
          feImg.setAttribute("width", `${maps.width}`)
          feImg.setAttribute("height", `${maps.height}`)
          feImg.setAttribute("preserveAspectRatio", "none")
          feImg.setAttribute("result", "map")

          const feDisp = document.createElementNS("http://www.w3.org/2000/svg", "feDisplacementMap")
          feDisp.setAttribute("in", "SourceGraphic")
          feDisp.setAttribute("in2", "map")
          feDisp.setAttribute("scale", `${2 * this.shoulderRadius * this.refraction}`)
          feDisp.setAttribute("xChannelSelector", "R")
          feDisp.setAttribute("yChannelSelector", "G")

          filter.appendChild(feImg)
          filter.appendChild(feDisp)
          defs.appendChild(filter)
          this.svgContainer.appendChild(defs)
          this.el.appendChild(this.svgContainer)
          this.hasFilter = true
        } else {
          const filter = this.svgContainer.querySelector("filter")
          const feImg = this.svgContainer.querySelector("feImage")
          const feDisp = this.svgContainer.querySelector("feDisplacementMap")
          if (filter && feImg && feDisp) {
            filter.setAttribute("width", `${maps.width}`)
            filter.setAttribute("height", `${maps.height}`)
            feImg.setAttribute("href", maps.displacement)
            feImg.setAttribute("width", `${maps.width}`)
            feImg.setAttribute("height", `${maps.height}`)
            feDisp.setAttribute("scale", `${2 * this.shoulderRadius * this.refraction}`)
            this.hasFilter = true
          }
        }
      }
    }

    updateMaps()
    if (typeof ResizeObserver !== "undefined") {
      let timer
      this.ro = new ResizeObserver(() => {
        clearTimeout(timer)
        timer = setTimeout(updateMaps, 90)
      })
      this.ro.observe(this.el)
    }
  }

  initEvents() {
    this.handlePointer = (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return
      this.isHovered = true
      const rect = this.el.getBoundingClientRect()
      const targetX = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1))
      const targetY = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1))
      this.springW.set(targetX)
      this.springG.set(targetY)
      this.startLoop()
    }

    this.el.addEventListener("pointerenter", this.handlePointer)
    this.el.addEventListener("pointermove", this.handlePointer)

    this.handleLeave = () => {
      this.isHovered = false
      this.isPressed = false
      this.springW.set(0)
      this.springG.set(0)
      this.startLoop()
    }

    this.el.addEventListener("pointerleave", this.handleLeave)
    this.el.addEventListener("pointercancel", this.handleLeave)

    this.handleDown = (e) => {
      if (e.button === 0) {
        this.handlePointer(e)
        this.isPressed = true
        this.startLoop()
      }
    }
    this.el.addEventListener("pointerdown", this.handleDown)

    this.handleWindowPointerUp = () => {
      if (this.isPressed) {
        this.isPressed = false
        this.startLoop()
      }
    }
    window.addEventListener("pointerup", this.handleWindowPointerUp)

    this.handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        this.isPressed = true
        this.startLoop()
      }
    }
    this.handleKeyUp = () => {
      this.isPressed = false
      this.startLoop()
    }
    this.handleBlur = () => {
      this.isHovered = false
      this.isPressed = false
      this.springW.set(0)
      this.springG.set(0)
      this.startLoop()
    }

    this.el.addEventListener("keydown", this.handleKeyDown)
    this.el.addEventListener("keyup", this.handleKeyUp)
    this.el.addEventListener("blur", this.handleBlur)

    if (!this.isNavbar) {
      this.handleClick = (e) => {
        this.springJ.jump(1.2)
        this.isPressed = false
        this.startLoop()
        if (this.onClick) {
          this.onClick(e)
        }
      }
      this.el.addEventListener("click", this.handleClick)
    }
  }

  startLoop() {
    if (!this.animId) {
      this.lastTime = performance.now()
      this.animId = requestAnimationFrame(this.render.bind(this))
    }
  }

  render(now) {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05)
    this.lastTime = now

    this.springK.set(this.isHovered ? 1 : 0)
    this.springJ.set(this.isPressed ? 1 : 0)

    const W = this.springW.step(dt)
    const G = this.springG.step(dt)
    const K = this.springK.step(dt)
    const J = this.springJ.step(dt)

    const q = Math.max(0, Math.min(1, K))
    const X = Math.max(0, Math.min(100, this.lightFollow)) / 100

    // Tilt factor: gentle for large navbar, dynamic for buttons
    const tiltMultiplier = this.isNavbar ? 0.35 : 1.0
    const rotX = (-G * K * 0.45 + J * 2.4) * tiltMultiplier
    const rotY = (W * K * 0.75) * tiltMultiplier
    const transY = (-0.65 * K + 1.8 * J) * tiltMultiplier
    const scX = 1 - 0.009 * J * tiltMultiplier
    const scY = 1 - 0.026 * J * tiltMultiplier

    if (this.face) {
      this.face.style.transform = `perspective(900px) translateY(${transY.toFixed(2)}px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scaleX(${scX.toFixed(4)}) scaleY(${scY.toFixed(4)})`
    }

    const n = q * (1 - J)
    const s1 = 4 + n * 1.5 - J * 2
    const s2 = 5 + n * 1.5 - J * 2
    const s3 = 12 + n * 2 - J * 8
    const s4 = 20 + n * 3 - J * 11
    if (this.body) {
      this.body.style.boxShadow = `0 1px 1px #00000028, 0 ${s1.toFixed(1)}px ${s2.toFixed(1)}px -3px #00000038, 0 ${s3.toFixed(1)}px ${s4.toFixed(1)}px -10px #00000035`
    }

    const ns = q * (1 - J * 0.4)
    const sh1 = 9 - ns * 2.5
    const sh2 = 12 - ns * 2
    const sh3 = -9 + ns * 2
    if (this.shoulder) {
      this.shoulder.style.boxShadow = `inset 0 ${sh1.toFixed(1)}px ${sh2.toFixed(1)}px -8px #00000070, inset 0 ${sh3.toFixed(1)}px 9px -7px #ffffffed, inset 5px 0 8px -7px #0000006b, inset -5px 0 8px -7px #0000004d`
    }

    const ze = this.baseBlur
    const Be = this.material === "frosted" ? ze + 9 : ze * 0.12
    const Ge = ze + (Be - ze) * q
    if (this.surface) {
      const urlPart = this.isChromium && this.hasFilter ? `url(#${this.filterId}) ` : ""
      const filterStr = `${urlPart}blur(${Ge.toFixed(2)}px) saturate(1.08)`
      this.surface.style.backdropFilter = filterStr
      this.surface.style.webkitBackdropFilter = filterStr
    }

    if (this.tint) {
      const tintAlpha =
        this.material === "clear"
          ? 0.045 - 0.025 * q
          : this.material === "frosted"
          ? 0.3
          : 0.28
      this.tint.style.opacity = tintAlpha.toFixed(3)
    }

    if (this.reflection) {
      const refX = -30 + K * 36 + W * K * 9
      const refY = G * K * 5
      const refOpacity = 0.16 + 0.18 * q + 0.08 * Math.sin(Math.PI * q)
      this.reflection.style.transform = `translateX(${refX.toFixed(2)}%) translateY(${refY.toFixed(2)}px)`
      this.reflection.style.opacity = refOpacity.toFixed(3)
    }

    if (this.caustic) {
      const causticX = K * 75 + W * K * 55
      const causticOpacity = 0.1 + 0.62 * K
      this.caustic.style.transform = `translateX(${causticX.toFixed(2)}%)`
      this.caustic.style.opacity = causticOpacity.toFixed(3)
    }

    const Z = 50 + W * 44
    const Se = 50 + G * 38
    const Ce = 100 - Z
    const we = 100 - Se
    const Te = q * X * (1 - J * 0.18)

    if (this.pointerLight) {
      const ellipseWidth = this.isNavbar ? 220 : 76
      const ellipseHeight = this.isNavbar ? 90 : 44
      this.pointerLight.style.background = `radial-gradient(ellipse ${ellipseWidth}px ${ellipseHeight}px at ${Z.toFixed(1)}% ${Se.toFixed(1)}%, #ffffff2b 0%, #ffffff12 36%, #ffffff00 78%)`
      this.pointerLight.style.opacity = Te.toFixed(3)
    }

    if (this.edgeLight) {
      const ellipseWidth = this.isNavbar ? 280 : 90
      const ellipseHeight = this.isNavbar ? 100 : 48
      this.edgeLight.style.background = `radial-gradient(ellipse ${ellipseWidth}px ${ellipseHeight}px at ${Z.toFixed(1)}% ${Se.toFixed(1)}%, #ffffffff 0%, #ffffffb8 32%, #ffffff00 82%)`
      this.edgeLight.style.opacity = Te.toFixed(3)
    }

    if (this.counterLight) {
      const ellipseWidth = this.isNavbar ? 200 : 70
      const ellipseHeight = this.isNavbar ? 80 : 36
      this.counterLight.style.background = `radial-gradient(ellipse ${ellipseWidth}px ${ellipseHeight}px at ${Ce.toFixed(1)}% ${we.toFixed(1)}%, #ffffffa6 0%, #ffffff35 35%, #ffffff00 82%)`
      this.counterLight.style.opacity = Te.toFixed(3)
    }

    if (this.rim) {
      const je = 180 + W * K * 12 - K * 24
      this.rim.style.background = `conic-gradient(from ${je.toFixed(1)}deg at 50% 50%, #ffffffdf 0deg, #ffffff60 36deg, #ffffff05 68deg, #00000021 112deg, #ffffff18 155deg, #ffffff 190deg, #ffffffb3 217deg, #ffffff06 256deg, #0000000f 300deg, #ffffff15 335deg, #ffffffdf 360deg)`
    }

    this.el.setAttribute("data-hover", this.isHovered ? "true" : "false")
    this.el.setAttribute("data-pressed", this.isPressed ? "true" : "false")

    const isAtRest =
      this.springW.isAtRest() &&
      this.springG.isAtRest() &&
      this.springK.isAtRest() &&
      this.springJ.isAtRest() &&
      !this.isHovered &&
      !this.isPressed

    if (!isAtRest) {
      this.animId = requestAnimationFrame(this.render.bind(this))
    } else {
      this.animId = null
    }
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId)
    }
    if (this.ro) {
      this.ro.disconnect()
    }
    if (this.svgContainer && this.svgContainer.parentNode) {
      this.svgContainer.parentNode.removeChild(this.svgContainer)
    }
    this.el.removeEventListener("pointerenter", this.handlePointer)
    this.el.removeEventListener("pointermove", this.handlePointer)
    this.el.removeEventListener("pointerleave", this.handleLeave)
    this.el.removeEventListener("pointercancel", this.handleLeave)
    this.el.removeEventListener("pointerdown", this.handleDown)
    window.removeEventListener("pointerup", this.handleWindowPointerUp)
    this.el.removeEventListener("keydown", this.handleKeyDown)
    this.el.removeEventListener("keyup", this.handleKeyUp)
    this.el.removeEventListener("blur", this.handleBlur)
    if (this.handleClick) {
      this.el.removeEventListener("click", this.handleClick)
    }
  }
}

/**
 * OpticalNavbar
 * Liquid Optical Glass capsule for the total long navbar background in the hero section.
 */
export function OpticalNavbar({ children, className = "", style = {}, material = "clear", surface = "light" }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    const engine = new OpticalEngine(containerRef.current, { isNavbar: true })
    return () => {
      engine.destroy()
    }
  }, [material, surface])

  return (
    <div
      ref={containerRef}
      className={`ml-optical-button ${className}`}
      data-disabled="false"
      data-hover="false"
      data-material={material}
      data-pressed="false"
      data-surface={surface}
      draggable="false"
      style={{
        width: "100%",
        height: "auto",
        lineHeight: "1.25em",
        "--og-radius": "999px",
        "--og-padding": "0px",
        "--og-gap": "0px",
        "--og-text": "#26282D",
        "--og-tint": "rgb(255, 255, 255)",
        "--og-tint-alpha": material === "frosted" ? "0.2" : "0.05",
        "--og-blur": material === "frosted" ? "12px" : "3px",
        "--og-focus": "rgb(89, 107, 145)",
        "--og-text-shadow": "0 1px 1px #ffffff45",
        cursor: "default",
        ...style,
      }}
    >
      <div className="ml-optical-face" style={{ transform: "none", padding: 0 }}>
        <div
          aria-hidden="true"
          className="ml-optical-body"
          style={{
            boxShadow:
              "0 1px 1px #00000028, 0 4px 5px -3px #00000038, 0 12px 20px -10px #00000035",
          }}
        >
          <div
            className="ml-optical-surface"
            style={{
              backdropFilter: `${material === "frosted" ? "blur(12px)" : "blur(3px)"} saturate(1.08)`,
              WebkitBackdropFilter: `${material === "frosted" ? "blur(12px)" : "blur(3px)"} saturate(1.08)`,
            }}
          >
            <div className="ml-optical-tint" style={{ opacity: material === "frosted" ? 0.2 : 0.05 }} />
            <div
              className="ml-optical-shoulder"
              style={{
                boxShadow:
                  "inset 0 9px 12px -8px #00000070, inset 0 -9px 9px -7px #ffffffed, inset 5px 0 8px -7px #0000006b, inset -5px 0 8px -7px #0000004d",
              }}
            />
            <img className="ml-optical-normal" alt="" draggable="false" />
            <div className="ml-optical-reflection" style={{ opacity: 0.16, transform: "translateX(-30%)" }} />
            <div className="ml-optical-caustic" style={{ opacity: 0.1, transform: "none" }} />
            <div
              className="ml-optical-pointer-light"
              style={{
                background:
                  "radial-gradient(ellipse 180px 60px at 50% 50%, #ffffff2b 0%, #ffffff12 36%, #ffffff00 78%)",
                opacity: 0,
              }}
            />
          </div>
          <div
            className="ml-optical-rim"
            style={{
              background:
                "conic-gradient(from 180deg at 50% 50%, #ffffffdf 0deg, #ffffff60 36deg, #ffffff05 68deg, #00000021 112deg, #ffffff18 155deg, #ffffff 190deg, #ffffffb3 217deg, #ffffff06 256deg, #0000000f 300deg, #ffffff15 335deg, #ffffffdf 360deg)",
            }}
          />
          <div
            className="ml-optical-rim ml-optical-edge-light"
            style={{
              background:
                "radial-gradient(ellipse 220px 70px at 50% 50%, #ffffffff 0%, #ffffffb8 32%, #ffffff00 82%)",
              opacity: 0,
            }}
          />
          <div
            className="ml-optical-rim ml-optical-counter-light"
            style={{
              background:
                "radial-gradient(ellipse 180px 50px at 50% 50%, #ffffffa6 0%, #ffffff35 35%, #ffffff00 82%)",
              opacity: 0,
            }}
          />
          <div className="ml-optical-bottom" />
        </div>
        {/* Child navigation content placed directly inside optical face */}
        <div style={{ position: "relative", zIndex: 2, width: "100%" }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * OpticalButton
 * Exact immutable optical button component downloaded from com19
 */
export function OpticalButton({
  label = "Get started",
  children,
  icon,
  onClick,
  material = "clear", // 'clear' | 'frosted'
  surface = "light",  // 'light' | 'dark'
  showIcon = false,
  className = "",
  style = {},
  fontSize = "16px",
  padding = "16px 28px",
}) {
  const buttonRef = useRef(null)
  const onClickRef = useRef(onClick)
  onClickRef.current = onClick

  useEffect(() => {
    if (!buttonRef.current) return
    const engine = new OpticalEngine(buttonRef.current, {
      onClick: (e) => onClickRef.current && onClickRef.current(e),
      isNavbar: false,
    })
    return () => {
      engine.destroy()
    }
  }, [material, surface])

  const blurVal = material === "frosted" ? "11.5px" : "2.5px"
  const tintAlpha = material === "frosted" ? "0.3" : "0.045"

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={typeof label === "string" ? label : "Button"}
      className={`ml-optical-button ${className}`}
      data-disabled="false"
      data-hover="false"
      data-material={material}
      data-pressed="false"
      data-surface={surface}
      draggable="false"
      style={{
        fontFamily: "'Liquid Glass Buttons Manrope', 'Manrope', sans-serif",
        fontSize: fontSize,
        fontWeight: 600,
        letterSpacing: "-0.015em",
        fontStyle: "normal",
        lineHeight: "1.25em",
        "--og-radius": "999px",
        "--og-padding": padding,
        "--og-gap": "8px",
        "--og-text": surface === "dark" ? "#ffffff" : "#26282D",
        "--og-tint": "rgb(255, 255, 255)",
        "--og-tint-alpha": tintAlpha,
        "--og-blur": blurVal,
        "--og-focus": "rgb(89, 107, 145)",
        "--og-text-shadow": surface === "dark" ? "0 1px 2px rgba(0,0,0,0.6)" : "0 1px 1px #ffffff45",
        ...style,
      }}
    >
      <span className="ml-optical-face" style={{ transform: "none" }}>
        <span
          aria-hidden="true"
          className="ml-optical-body"
          style={{
            boxShadow:
              "0 1px 1px #00000028, 0 4px 5px -3px #00000038, 0 12px 20px -10px #00000035",
          }}
        >
          <span
            className="ml-optical-surface"
            style={{
              backdropFilter: `blur(${blurVal}) saturate(1.08)`,
              WebkitBackdropFilter: `blur(${blurVal}) saturate(1.08)`,
            }}
          >
            <span className="ml-optical-tint" style={{ opacity: tintAlpha }} />
            <span
              className="ml-optical-shoulder"
              style={{
                boxShadow:
                  "inset 0 9px 12px -8px #00000070, inset 0 -9px 9px -7px #ffffffed, inset 5px 0 8px -7px #0000006b, inset -5px 0 8px -7px #0000004d",
              }}
            />
            <img className="ml-optical-normal" alt="" draggable="false" />
            <span className="ml-optical-reflection" style={{ opacity: 0.16, transform: "translateX(-30%)" }} />
            <span className="ml-optical-caustic" style={{ opacity: 0.1, transform: "none" }} />
            <span
              className="ml-optical-pointer-light"
              style={{
                background:
                  "radial-gradient(ellipse 76px 44px at 50% 50%, #ffffff2b 0%, #ffffff12 36%, #ffffff00 78%)",
                opacity: 0,
              }}
            />
          </span>
          <span
            className="ml-optical-rim"
            style={{
              background:
                "conic-gradient(from 180deg at 50% 50%, #ffffffdf 0deg, #ffffff60 36deg, #ffffff05 68deg, #00000021 112deg, #ffffff18 155deg, #ffffff 190deg, #ffffffb3 217deg, #ffffff06 256deg, #0000000f 300deg, #ffffff15 335deg, #ffffffdf 360deg)",
            }}
          />
          <span
            className="ml-optical-rim ml-optical-edge-light"
            style={{
              background:
                "radial-gradient(ellipse 90px 48px at 50% 50%, #ffffffff 0%, #ffffffb8 32%, #ffffff00 82%)",
              opacity: 0,
            }}
          />
          <span
            className="ml-optical-rim ml-optical-counter-light"
            style={{
              background:
                "radial-gradient(ellipse 70px 36px at 50% 50%, #ffffffa6 0%, #ffffff35 35%, #ffffff00 82%)",
              opacity: 0,
            }}
          />
          <span className="ml-optical-bottom" />
        </span>
        {icon && (
          <span
            aria-hidden="true"
            className="ml-optical-icon"
            style={{ color: surface === "dark" ? "#ffffff" : "inherit" }}
          >
            {icon}
          </span>
        )}
        <span
          className="ml-optical-label"
          style={{
            fontSize: fontSize,
            color: surface === "dark" ? "#ffffff" : "inherit",
            textShadow: surface === "dark" ? "0 1px 2px rgba(0, 0, 0, 0.6)" : "0 1px 1px #ffffff45",
          }}
        >
          {children || label}
        </span>
        {showIcon && !icon && (
          <span aria-hidden="true" className="ml-optical-icon">
            <div className="framer-1wwmpe7">
              <svg className="framer-9z9jey" role="presentation" viewBox="0 0 24 24" fill="none">
                <path
                  d="M 0 0 L 7.5 7.5 L 0 15"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.25"
                  stroke="currentColor"
                  transform="translate(9 4.5)"
                />
              </svg>
            </div>
          </span>
        )}
      </span>
    </button>
  )
}

export default OpticalButton
