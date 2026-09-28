import React, { useRef, useEffect } from "react";

const vsSource = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
      vUv = (aPosition + 1.0) * 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const fsSource = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uHover;
  uniform float uClick;
  uniform vec3 uBaseColor;
  uniform vec3 uGlassColor;
  uniform vec2 uResolution;

  // Hash function for pseudo-randomness
  float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // Simplex-style noise
  float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  // Fractal Brownian Motion for liquid distortion
  float fbm(vec2 p) {
      float f = 0.0;
      float amp = 0.5;
      for(int i = 0; i < 4; i++) {
          f += amp * noise(p);
          p *= 2.0;
          amp *= 0.5;
      }
      return f;
  }

  void main() {
      // Aspect-corrected coordinates for perfect pill shape math
      float aspect = max(uResolution.x, 1.0) / max(uResolution.y, 1.0);
      vec2 p = vUv * 2.0 - 1.0;
      p.x *= aspect;

      // Center calculations for the liquid click surge
      vec2 center = vec2(0.5);
      vec2 dirToCenter = normalize(vUv - center + vec2(0.0001));
      float distToCenter = length(vUv - center);

      // 1. SDF (Signed Distance Field) for a Pill Shape
      float r = 1.0; 
      vec2 b = vec2(max(aspect - 1.0, 0.0), 0.0);
      vec2 d = abs(p) - b;
      float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
      
      // Normalized distance from edge (0 = edge, 1 = center)
      float innerDist = clamp(abs(dist), 0.0, 1.0);

      // 2. Dynamic Liquid Noise Field
      float t = uTime;
      
      // Stretch noise horizontally
      vec2 noiseUv = vUv * vec2(2.0, 1.0); 
      
      // Dynamic warping on hover + Liquid Surge on Click
      vec2 warp = vec2(fbm(noiseUv + t * 0.5), fbm(noiseUv + t * 0.5 + 12.34)) * mix(0.0, 0.4, uHover);
      warp -= dirToCenter * uClick * 0.25 * smoothstep(0.8, 0.0, distToCenter);
      
      float n1 = fbm(noiseUv + warp + vec2(t, 0.0));
      float n2 = fbm(noiseUv + warp + vec2(n1, t * 1.2));

      // 3. Glassy Rim & Specular Highlights
      float rimWidth = mix(0.15, 0.35, n2) * mix(1.0, 1.4, uHover);
      rimWidth += uClick * 0.15;
      float rim = smoothstep(rimWidth, 0.0, innerDist);
      
      float specDist = abs(innerDist - 0.12 + n1 * 0.08);
      float specular = smoothstep(0.03, 0.0, specDist);

      float rightBias = smoothstep(0.2, 1.0, vUv.x);
      rim *= mix(0.6, 1.5, rightBias);
      specular *= mix(0.5, 2.0, rightBias);

      // 4. Highly Dynamic Stars / Particles
      vec2 starUv = vUv * vec2(aspect * 6.0, 6.0);
      
      starUv.x -= uTime * 0.2; 
      starUv.y += sin(uTime * 0.5 + starUv.x) * mix(0.2, 0.6, uHover); 
      
      starUv += dirToCenter * uClick * 1.5;

      vec2 id = floor(starUv);
      vec2 gv = fract(starUv) - 0.5;
      float nStar = hash(id);
      float star = 0.0;
      
      float starThreshold = mix(0.94, 0.86, uHover); 
      
      if (nStar > starThreshold) { 
          float sizeMod = mix(0.5, 2.5, hash(id + 13.37)); 
          
          vec2 localWiggle = vec2(
              sin(uTime * 2.0 + nStar * 50.0),
              cos(uTime * 2.3 + nStar * 40.0)
          ) * 0.25 * uHover;

          float starDist = length(gv - localWiggle) * sizeMod;
          
          star = smoothstep(0.12, 0.0, starDist);
          star += smoothstep(0.25, 0.0, starDist) * 0.3;

          float twinklePhase = uTime * mix(5.0, 15.0, hash(id + 42.0));
          star *= sin(twinklePhase + nStar * 100.0) * 0.5 + 0.5; 
          
          star *= smoothstep(0.05, 0.2, innerDist); 
      }

      // 5. Compositing
      vec3 color = uBaseColor;
      
      float innerLiquid = smoothstep(0.2, 0.9, n2) * (1.0 - innerDist) * mix(0.2, 0.45, uHover);
      color += uGlassColor * innerLiquid;
      
      color += uGlassColor * rim * mix(0.6, 1.2, uHover);
      color += vec3(1.0) * specular * mix(0.8, 2.0, uHover);
      
      color += vec3(1.0) * star * mix(0.8, 1.5, uHover);

      color += uGlassColor * rim * uClick * 0.8;
      color += vec3(1.0) * specular * uClick * 1.5;
      color += uGlassColor * exp(-distToCenter * 6.0) * uClick * 0.6;

      color *= smoothstep(1.5, 0.2, length(vUv - 0.5));

      gl_FragColor = vec4(color, 1.0);
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Singleton WebGL Renderer:
 * Maintains a single offscreen WebGL context for the entire application,
 * eliminating browser context limit exhaustion (16 context ceiling in Chromium)
 * and rendering liquid metal frames directly to 2D canvas elements with 100% shader fidelity.
 */
class LiquidMetalRenderer {
  constructor() {
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.instances = new Set();
    this.animId = null;
    this.lastTime = performance.now();
    this.isSupported = true;
    this.hoverSpeed = 0.6;
    this.init();
  }

  init() {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    this.canvas = document.createElement("canvas");
    this.canvas.width = 320;
    this.canvas.height = 96;

    const glOptions = {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    };

    try {
      this.gl =
        this.canvas.getContext("webgl", glOptions) ||
        this.canvas.getContext("experimental-webgl", glOptions);
    } catch {
      this.isSupported = false;
      return;
    }

    if (!this.gl) {
      this.isSupported = false;
      return;
    }

    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    });

    this.canvas.addEventListener("webglcontextrestored", () => {
      this.initGL();
      this.startLoop();
    });

    this.initGL();
  }

  initGL() {
    const gl = this.gl;
    if (!gl) return;

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
      this.isSupported = false;
      return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      this.isSupported = false;
      return;
    }

    this.program = program;
    this.aPositionLoc = gl.getAttribLocation(program, "aPosition");
    this.uTimeLoc = gl.getUniformLocation(program, "uTime");
    this.uHoverLoc = gl.getUniformLocation(program, "uHover");
    this.uClickLoc = gl.getUniformLocation(program, "uClick");
    this.uBaseColorLoc = gl.getUniformLocation(program, "uBaseColor");
    this.uGlassColorLoc = gl.getUniformLocation(program, "uGlassColor");
    this.uResolutionLoc = gl.getUniformLocation(program, "uResolution");

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );
  }

  register(instance) {
    this.instances.add(instance);
    if (!this.isSupported) {
      this.drawFallback(instance);
      return;
    }
    if (this.instances.size === 1) {
      this.startLoop();
    }
  }

  unregister(instance) {
    this.instances.delete(instance);
    if (this.instances.size === 0 && this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  startLoop() {
    if (this.animId) return;
    this.lastTime = performance.now();
    const render = (now) => {
      this.animId = requestAnimationFrame(render);
      this.renderFrame(now);
    };
    this.animId = requestAnimationFrame(render);
  }

  renderFrame(now) {
    if (!this.gl || !this.program || !this.isSupported) return;

    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    const gl = this.gl;

    for (const inst of this.instances) {
      if (!inst.isVisible || !inst.canvas || !inst.ctx) continue;
      if (inst.width <= 0 || inst.height <= 0) continue;

      // Smooth hover lerp
      const targetHover = inst.isHovered ? 1.0 : 0.0;
      inst.hoverProgress = lerp(inst.hoverProgress, targetHover, Math.min(1.0, delta * 4.0));

      // Liquid click surge
      if (inst.clickTrigger > 0) {
        inst.clickProgress = inst.clickTrigger;
        inst.clickTrigger = 0;
      }
      inst.clickProgress = lerp(inst.clickProgress, 0.0, Math.min(1.0, delta * 6.0));

      // Dynamic speed based on hover
      const currentSpeed = lerp(0.15, this.hoverSpeed, inst.hoverProgress);
      inst.uTime += delta * currentSpeed;

      const w = inst.width;
      const h = inst.height;

      // Adjust offscreen WebGL buffer to current instance resolution
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
      }

      gl.viewport(0, 0, w, h);
      gl.useProgram(this.program);

      gl.uniform1f(this.uTimeLoc, inst.uTime);
      gl.uniform1f(this.uHoverLoc, inst.hoverProgress);
      gl.uniform1f(this.uClickLoc, inst.clickProgress);
      gl.uniform3f(this.uBaseColorLoc, 0.02, 0.02, 0.02);
      gl.uniform3f(this.uGlassColorLoc, 1.0, 1.0, 1.0);
      gl.uniform2f(this.uResolutionLoc, w, h);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.vertexAttribPointer(this.aPositionLoc, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(this.aPositionLoc);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Blit to the instance's 2D canvas
      inst.ctx.clearRect(0, 0, w, h);
      inst.ctx.drawImage(this.canvas, 0, 0);
    }
  }

  drawFallback(inst) {
    if (!inst.ctx || inst.width <= 0 || inst.height <= 0) return;
    const ctx = inst.ctx;
    ctx.clearRect(0, 0, inst.width, inst.height);
    const grad = ctx.createLinearGradient(0, 0, inst.width, inst.height);
    grad.addColorStop(0, "rgba(20, 20, 24, 0.9)");
    grad.addColorStop(0.5, "rgba(40, 40, 48, 0.85)");
    grad.addColorStop(1, "rgba(12, 12, 16, 0.9)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, inst.width, inst.height);
  }
}

let sharedRenderer = null;
function getLiquidMetalRenderer() {
  if (typeof window === "undefined") return null;
  if (!sharedRenderer) {
    sharedRenderer = new LiquidMetalRenderer();
  }
  return sharedRenderer;
}

export default function LiquidMetalButton({
  children,
  onClick,
  className = "",
  style = {},
  labelStyle = {},
  ariaLabel,
}) {
  const buttonRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;
    const canvas = canvasRef.current;
    if (!button || !canvas) return;

    const renderer = getLiquidMetalRenderer();
    if (!renderer) return;

    let ctx = null;
    try {
      ctx = canvas.getContext("2d", { alpha: true });
    } catch {
      return;
    }
    if (!ctx) return;

    const inst = {
      button,
      canvas,
      ctx,
      width: 0,
      height: 0,
      isHovered: false,
      clickTrigger: 0,
      hoverProgress: 0,
      clickProgress: 0,
      uTime: Math.random() * 20,
      isVisible: true,
    };

    const updateDimensions = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));

      if (inst.width !== w || inst.height !== h) {
        inst.width = w;
        inst.height = h;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
      }
    };

    updateDimensions();

    const handleMouseEnter = () => {
      inst.isHovered = true;
      button.style.zIndex = "10";
    };

    const handleMouseLeave = () => {
      inst.isHovered = false;
      button.style.transform = "scale(1)";
      button.style.zIndex = "1";
    };

    const handleMouseDown = () => {
      button.style.transform = "scale(0.96)";
      inst.clickTrigger = 1.0;
    };

    const handleWindowMouseUp = () => {
      if (button) button.style.transform = "scale(1)";
    };

    const handleTouchStart = () => {
      inst.isHovered = true;
      inst.clickTrigger = 1.0;
      button.style.transform = "scale(0.96)";
    };

    let touchTimeout;
    const handleWindowTouchEnd = () => {
      if (button) button.style.transform = "scale(1)";
      touchTimeout = setTimeout(() => {
        inst.isHovered = false;
      }, 400);
    };

    button.addEventListener("mouseenter", handleMouseEnter);
    button.addEventListener("mouseleave", handleMouseLeave);
    button.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleWindowMouseUp);
    button.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleWindowTouchEnd);

    let resizeObserver = null;
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => {
        updateDimensions();
      });
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener("resize", updateDimensions);
    }

    let intersectionObserver = null;
    if ("IntersectionObserver" in window) {
      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          inst.isVisible = entry.isIntersecting;
        },
        { threshold: 0.01 }
      );
      intersectionObserver.observe(button);
    }

    renderer.register(inst);

    return () => {
      clearTimeout(touchTimeout);
      button.removeEventListener("mouseenter", handleMouseEnter);
      button.removeEventListener("mouseleave", handleMouseLeave);
      button.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      button.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleWindowTouchEnd);

      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", updateDimensions);
      }

      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }

      renderer.unregister(inst);
    };
  }, []);

  return (
    <div
      ref={buttonRef}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick && onClick(e);
        }
      }}
      className={`liquid-metal-button ${className}`}
      style={style}
      aria-label={ariaLabel || (typeof children === "string" ? children : "Liquid metal button")}
    >
      <div className="liquid-canvas-wrapper">
        <div className="liquid-canvas-inner">
          <div className="liquid-canvas-box">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
      <div className="liquid-button-label" style={labelStyle}>
        {children}
      </div>
    </div>
  );
}
