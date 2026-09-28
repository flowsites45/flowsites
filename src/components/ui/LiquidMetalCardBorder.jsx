import React, { useEffect, useRef, memo } from "react";

/**
 * White Liquid Metal Procedural WebGL2 Shader Engine
 * Extracted from flowsites add glasssss (SILVER_CONFIG & WebGL2 Shaders).
 * Performance Overhaul:
 * - Tab visibility aware (pauses when tab is hidden)
 * - Viewport aware (unsubscribes when scrolled off screen)
 * - Shared singleton ResizeObserver (replaces 30+ independent instances)
 * - Zero React re-renders on hover (100% CSS-driven opacity transitions)
 * - Clamped device pixel ratio (prevents GPU fill-rate exhaustion on Retina/4K)
 * - Hardware-accelerated 2D canvas evenodd perimeter clipping
 */

const VERTEX_SHADER_SRC = `#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_texCoord;

out vec2 v_uv;

void main() {
    v_uv = a_texCoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

#define U_COLORS_MAX 8

uniform vec4 u_colors[8];
uniform int u_colors_length;
uniform float u_angle;
uniform float u_bend;
uniform vec4 u_colorBack;
uniform float u_contour;
uniform float u_motionMode;
uniform float u_scale;
uniform float u_seed;
uniform float u_speed;
uniform float u_turbAmp;
uniform float u_turbFreq;
uniform float u_turbIter;
uniform float u_waveFreq;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_deltaTime;
uniform float u_pixelRatio;
uniform vec4 u_mousePosition;
uniform float u_mousePointerDown;
uniform float u_mouseHover;

// === CONSTANTS ===
const float GOLDEN_ANGLE = 2.3999632;
const float TAU = 6.28318530;

// === PCG hash ===
uvec3 hash3(uvec3 v) {
    v = v * 1664525u + 1013904223u;
    v.x += v.y * v.z;
    v.y += v.z * v.x;
    v.z += v.x * v.y;
    v ^= v >> 16u;
    v.x += v.y * v.z;
    v.y += v.z * v.x;
    v.z += v.x * v.y;
    return v;
}

vec3 seedRandom(float seedVal) {
    uvec3 s = uvec3(
        floatBitsToUint(seedVal),
        floatBitsToUint(seedVal * 1.5 + 7.31),
        floatBitsToUint(seedVal * 2.7 + 13.37)
    );
    s = hash3(s);
    return vec3(s) / float(0xFFFFFFFFu);
}

// === COLOR SPACE (Oklab/LCH) ===
vec3 toLinear(vec3 c) {
    return pow(c, vec3(2.2));
}

vec3 toSrgb(vec3 c) {
    return pow(clamp(c, 0.0, 1.0), vec3(0.4545));
}

vec3 linearToOklab(vec3 c) {
    float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
    float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
    float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;

    l = pow(max(l, 0.0), 1.0 / 3.0);
    m = pow(max(m, 0.0), 1.0 / 3.0);
    s = pow(max(s, 0.0), 1.0 / 3.0);

    return vec3(
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    );
}

vec3 oklabToLinear(vec3 c) {
    float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
    float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
    float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;

    l = l * l * l;
    m = m * m * m;
    s = s * s * s;

    return vec3(
        +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    );
}

vec3 oklabToLch(vec3 lab) {
    return vec3(lab.x, length(lab.yz), atan(lab.z, lab.y));
}

vec3 lchToOklab(vec3 lch) {
    return vec3(lch.x, lch.y * cos(lch.z), lch.y * sin(lch.z));
}

vec3 mixLch(vec3 lab0, vec3 lab1, float t) {
    vec3 lch0 = oklabToLch(lab0);
    vec3 lch1 = oklabToLch(lab1);

    if (lch0.y < 0.05) lch0.z = lch1.z;
    if (lch1.y < 0.05) lch1.z = lch0.z;

    float dh = lch1.z - lch0.z;
    if (dh > 3.14159265) dh -= 6.28318530;
    if (dh < -3.14159265) dh += 6.28318530;

    return lchToOklab(vec3(
        mix(lch0.x, lch1.x, t),
        mix(lch0.y, lch1.y, t),
        lch0.z + dh * t
    ));
}

// === PALETTE ===
vec3 getColor(int idx) {
    if (u_colors_length < 1) return vec3(0.0);
    int safeIdx = clamp(idx, 0, u_colors_length - 1);
    return u_colors[safeIdx].rgb;
}

vec3 paletteN(float t, int count) {
    if (count < 1) return vec3(0.0);
    if (count < 2) return toLinear(getColor(0));

    float segmentSize = 1.0 / float(count - 1);
    t = clamp(t, 0.0, 1.0);
    int idx = min(int(floor(t / segmentSize)), count - 2);
    float localT = clamp((t - float(idx) * segmentSize) / segmentSize, 0.0, 1.0);

    vec3 lab0 = linearToOklab(toLinear(getColor(idx)));
    vec3 lab1 = linearToOklab(toLinear(getColor(idx + 1)));

    return oklabToLinear(mixLch(lab0, lab1, localT));
}

// === POST-PROCESS ===
vec3 softGamutMap(vec3 linearRgb) {
    float maxC = max(linearRgb.r, max(linearRgb.g, linearRgb.b));
    float minC = min(linearRgb.r, min(linearRgb.g, linearRgb.b));

    if (minC >= 0.0 && maxC <= 1.0) return linearRgb;

    vec3 lab = linearToOklab(max(linearRgb, 0.0));
    float L = clamp(lab.x, 0.0, 1.0);
    float C = length(lab.yz);
    float h = atan(lab.z, lab.y);

    float maxChroma = 0.4 * (1.0 - pow(abs(2.0 * L - 1.0), 2.0));

    if (C > maxChroma * 0.7) {
        float knee = maxChroma * 0.7;
        C = knee + (maxChroma - knee) * tanh((C - knee) / (maxChroma - knee + 0.001));
    }

    return clamp(oklabToLinear(vec3(L, C * cos(h), C * sin(h))), 0.0, 1.0);
}

void main() {
    vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
    float canvasAspect = u_resolution.x / u_resolution.y;

    vec2 p = (uv - 0.5) * 2.0;
    p.x *= canvasAspect;

    // Angle along the card perimeter [-PI, PI] for continuous circulation
    float theta = atan(p.y, p.x);

    // Active continuous flow time
    float t = u_time * u_speed;
    float flowTime = t * 3.2;

    // Wave moving along the perimeter path
    float flowWave = theta * 2.0 - flowTime;

    // Seed-based turbulence
    vec3 seedOffset = seedRandom(u_seed);
    vec3 seedOffset2 = seedRandom(u_seed + 100.0);
    vec2 seedPhase = (seedOffset2.xy - 0.5) * TAU;

    vec2 q = p * u_scale;
    float rotA = t * 0.6;
    q = mat2(cos(rotA), -sin(rotA), sin(rotA), cos(rotA)) * q;

    float a = seedPhase.x + t * 0.4;
    float d = seedPhase.y - t * 0.25;

    int turbIter = int(u_turbIter);
    float freq = 1.0 / max(u_turbFreq, 0.01);

    for (int j = 2; j < 8; j++) {
        if (j >= turbIter) break;
        float fj = float(j);
        q += u_turbAmp * sin(length(q) / freq * fj + flowTime + vec2(a, d) + seedOffset.xy * fj) / fj;
        a += cos(fj + d * 1.2 + q.x * 2.0 - flowTime + seedOffset2.z);
        d += sin(fj * q.y + a + seedOffset.z + flowTime + seedOffset2.y);
    }

    // High-contrast flowing liquid ribbons circulating continuously around the border
    float wave1 = sin(flowWave + length(q.yx) * u_waveFreq + a * 0.35);
    float wave2 = cos(flowWave * 1.5 - q.x * 1.2 + d * 0.25);
    float combined = 0.5 + 0.35 * wave1 + 0.15 * wave2;

    // Expand contrast for distinct, brilliant white chrome reflections
    float val = smoothstep(0.12, 0.88, combined);
    val = pow(val, 1.2);

    int colorCount = u_colors_length;
    vec3 col = paletteN(val, colorCount);
    col = softGamutMap(col);
    col = toSrgb(col);

    fragColor = vec4(col, 1.0);
}
`;

// High-contrast White Liquid Metal palette
const SILVER_CONFIG = {
  colors: [
    [10 / 255, 14 / 255, 26 / 255, 1.0],     // Deep obsidian metal contrast (#0a0e1a)
    [75 / 255, 95 / 255, 125 / 255, 1.0],    // Cool metallic slate chrome (#4b5f7d)
    [185 / 255, 205 / 255, 230 / 255, 1.0],  // Molten liquid silver (#b9cde6)
    [255 / 255, 255 / 255, 255 / 255, 1.0],  // Brilliant white liquid shine (#ffffff)
  ],
  colorBack: [0.0, 2 / 255, 11 / 255, 1.0],
  seed: 22.0,
  speed: 1.5,
  motionMode: 1.0,
  angle: 18.0,
  scale: 2.2,
  bend: 0.28,
  contour: 0.8,
  turbAmp: 0.32,
  turbFreq: 1.2,
  turbIter: 5.0,
  waveFreq: 2.6,
};

/**
 * Singleton WebGL2 Shader Engine
 * - Exactly 1 WebGL2 context for the entire application (0 context loss).
 * - Pauses automatically when tab is hidden or when no cards are hovered.
 */
class SharedLiquidMetalEngine {
  constructor() {
    this.subscribers = new Set();
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.uniforms = {};
    this.vao = null;
    this.animId = null;
    this.startTime = performance.now();
    this.lastTime = performance.now();
    this.mouse = { x: 0, y: 0, prevX: 0, prevY: 0, isHover: 1.0, isDown: 0.0 };
    this.isInitialized = false;
    this.isPaused = false;

    // Tab visibility handling
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.pause();
        } else {
          this.resume();
        }
      });
    }
  }

  init() {
    if (this.isInitialized || typeof window === "undefined") return;

    this.canvas = document.createElement("canvas");
    this.canvas.width = 512;
    this.canvas.height = 512;

    const gl = this.canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });

    if (!gl) {
      console.warn("WebGL2 not supported, liquid metal border disabled");
      return;
    }

    this.gl = gl;

    const vertShader = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fragShader = this.compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Shader link failed:", gl.getProgramInfoLog(program));
      return;
    }

    this.program = program;
    gl.useProgram(program);

    // Quad Buffers
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    this.vao = vao;

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      gl.STATIC_DRAW
    );
    const texLoc = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

    // Locate uniforms
    const names = [
      "u_time",
      "u_resolution",
      "u_deltaTime",
      "u_pixelRatio",
      "u_mousePosition",
      "u_mousePointerDown",
      "u_mouseHover",
      "u_angle",
      "u_bend",
      "u_colorBack",
      "u_contour",
      "u_motionMode",
      "u_scale",
      "u_seed",
      "u_speed",
      "u_turbAmp",
      "u_turbFreq",
      "u_turbIter",
      "u_waveFreq",
      "u_colors_length",
    ];
    names.forEach((name) => {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    });

    for (let i = 0; i < 8; i++) {
      this.uniforms[`u_colors_${i}`] = gl.getUniformLocation(program, `u_colors[${i}]`);
    }

    // Set static uniforms from SILVER_CONFIG
    const c = SILVER_CONFIG;
    if (this.uniforms.u_angle) gl.uniform1f(this.uniforms.u_angle, c.angle);
    if (this.uniforms.u_bend) gl.uniform1f(this.uniforms.u_bend, c.bend);
    if (this.uniforms.u_contour) gl.uniform1f(this.uniforms.u_contour, c.contour);
    if (this.uniforms.u_motionMode) gl.uniform1f(this.uniforms.u_motionMode, c.motionMode);
    if (this.uniforms.u_scale) gl.uniform1f(this.uniforms.u_scale, c.scale);
    if (this.uniforms.u_seed) gl.uniform1f(this.uniforms.u_seed, c.seed);
    if (this.uniforms.u_speed) gl.uniform1f(this.uniforms.u_speed, c.speed);
    if (this.uniforms.u_turbAmp) gl.uniform1f(this.uniforms.u_turbAmp, c.turbAmp);
    if (this.uniforms.u_turbFreq) gl.uniform1f(this.uniforms.u_turbFreq, c.turbFreq);
    if (this.uniforms.u_turbIter) gl.uniform1f(this.uniforms.u_turbIter, c.turbIter);
    if (this.uniforms.u_waveFreq) gl.uniform1f(this.uniforms.u_waveFreq, c.waveFreq);

    if (this.uniforms.u_colorBack) {
      gl.uniform4fv(this.uniforms.u_colorBack, new Float32Array(c.colorBack));
    }
    if (this.uniforms.u_colors_length) {
      gl.uniform1i(this.uniforms.u_colors_length, c.colors.length);
    }
    c.colors.forEach((col, i) => {
      const loc = this.uniforms[`u_colors_${i}`];
      if (loc) gl.uniform4fv(loc, new Float32Array(col));
    });

    this.tick = this.tick.bind(this);
    this.isInitialized = true;
  }

  compileShader(type, src) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  subscribe(subscriber) {
    this.init();
    this.subscribers.add(subscriber);
    if (!this.animId && this.gl && !this.isPaused) {
      this.lastTime = performance.now();
      this.animId = requestAnimationFrame(this.tick);
    }
  }

  unsubscribe(subscriber) {
    this.subscribers.delete(subscriber);
    if (this.subscribers.size === 0 && this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  pause() {
    this.isPaused = true;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  resume() {
    this.isPaused = false;
    if (this.subscribers.size > 0 && !this.animId && this.gl) {
      this.lastTime = performance.now();
      this.animId = requestAnimationFrame(this.tick);
    }
  }

  updateMouse(x, y, w, h) {
    if (w && h && this.canvas) {
      this.mouse.prevX = this.mouse.x;
      this.mouse.prevY = this.mouse.y;
      this.mouse.x = (x / w) * this.canvas.width;
      this.mouse.y = (y / h) * this.canvas.height;
    }
  }

  tick(now) {
    if (this.subscribers.size === 0 || this.isPaused) {
      this.animId = null;
      return;
    }

    const gl = this.gl;
    if (!gl) return;

    this.animId = requestAnimationFrame(this.tick);

    const elapsed = (now - this.startTime) * 0.001;
    const delta = (now - this.lastTime) * 0.001;
    this.lastTime = now;

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    if (this.uniforms.u_time) gl.uniform1f(this.uniforms.u_time, elapsed);
    if (this.uniforms.u_deltaTime) gl.uniform1f(this.uniforms.u_deltaTime, delta);
    if (this.uniforms.u_resolution) {
      gl.uniform2f(this.uniforms.u_resolution, this.canvas.width, this.canvas.height);
    }
    if (this.uniforms.u_pixelRatio) {
      gl.uniform1f(this.uniforms.u_pixelRatio, 1.0);
    }
    if (this.uniforms.u_mousePosition) {
      gl.uniform4f(
        this.uniforms.u_mousePosition,
        this.mouse.x,
        this.mouse.y,
        this.mouse.prevX,
        this.mouse.prevY
      );
    }
    if (this.uniforms.u_mousePointerDown) {
      gl.uniform1f(this.uniforms.u_mousePointerDown, this.mouse.isDown);
    }
    if (this.uniforms.u_mouseHover) {
      gl.uniform1f(this.uniforms.u_mouseHover, 1.0);
    }

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    // Blit to active hovered cards with individual speed support
    for (const sub of this.subscribers) {
      const speed = typeof sub.speed === "number" ? sub.speed : c.speed;
      if (this.uniforms.u_speed) {
        gl.uniform1f(this.uniforms.u_speed, speed);
      }
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      sub.draw(this.canvas);
    }
  }
}

const sharedEngine = new SharedLiquidMetalEngine();

// Shared Singleton ResizeObserver across all cards (eliminates 30+ separate instances)
const resizeCallbacks = new Map();
const sharedResizeObserver =
  typeof ResizeObserver !== "undefined"
    ? new ResizeObserver((entries) => {
        for (const entry of entries) {
          const cb = resizeCallbacks.get(entry.target);
          if (cb) cb();
        }
      })
    : null;

/** Helper fallback to draw rounded rectangle path for older engines */
function drawRoundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/**
 * LiquidMetalCardBorder Component
 * Pure CSS hover transitions + isolated WebGL rendering (0 React state re-renders).
 */
function LiquidMetalCardBorderComponent({
  borderRadius = 20,
  speed = 0.35,
  glow = "normal",
} = {}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const card = container.parentElement;
    if (!card) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let fadeTimer = null;
    let isActive = false;
    let isVisibleInViewport = true;

    const updateSize = () => {
      // Clamp DPR to 1.5 to protect GPU fill-rate on high-density displays
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.round(container.offsetWidth * dpr);
      const h = Math.round(container.offsetHeight * dpr);
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    updateSize();

    if (sharedResizeObserver) {
      resizeCallbacks.set(container, updateSize);
      sharedResizeObserver.observe(container);
    }

    const subscriber = {
      get speed() {
        return speedRef.current;
      },
      draw: (webglCanvas) => {
        let w = canvas.width;
        let h = canvas.height;
        if (!w || !h) {
          updateSize();
          w = canvas.width;
          h = canvas.height;
          if (!w || !h) return;
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const borderWidth = 2.8 * dpr;
        const radius = borderRadius * dpr;

        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.beginPath();

        if (ctx.roundRect) {
          ctx.roundRect(0, 0, w, h, radius);
          ctx.roundRect(
            borderWidth,
            borderWidth,
            Math.max(1, w - borderWidth * 2),
            Math.max(1, h - borderWidth * 2),
            Math.max(0, radius - borderWidth)
          );
        } else {
          drawRoundedRectPath(ctx, 0, 0, w, h, radius);
          drawRoundedRectPath(
            ctx,
            borderWidth,
            borderWidth,
            Math.max(1, w - borderWidth * 2),
            Math.max(1, h - borderWidth * 2),
            Math.max(0, radius - borderWidth)
          );
        }

        // EvenOdd clipping rule: keeps only the 2.8px border track; interior is 100% transparent
        ctx.clip("evenodd");
        ctx.drawImage(webglCanvas, 0, 0, w, h);
        ctx.restore();
      },
    };

    const handleMouseEnter = () => {
      if (!isVisibleInViewport) return;
      if (fadeTimer) {
        clearTimeout(fadeTimer);
        fadeTimer = null;
      }
      updateSize();
      if (!isActive) {
        isActive = true;
        sharedEngine.subscribe(subscriber);
      }
    };

    const handleMouseLeave = () => {
      fadeTimer = setTimeout(() => {
        if (isActive) {
          isActive = false;
          sharedEngine.unsubscribe(subscriber);
        }
      }, 350);
    };

    const handleMouseMove = (e) => {
      if (!isActive || !isVisibleInViewport) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      sharedEngine.updateMouse(x, y, rect.width, rect.height);
    };

    card.addEventListener("mouseenter", handleMouseEnter);
    card.addEventListener("mouseleave", handleMouseLeave);
    card.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Viewport intersection observer: immediately pause if scrolled off screen
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisibleInViewport = entry.isIntersecting;
        if (!entry.isIntersecting && isActive) {
          isActive = false;
          sharedEngine.unsubscribe(subscriber);
        }
      },
      { rootMargin: "100px 0px" }
    );
    io.observe(container);

    if (card.matches && card.matches(":hover")) {
      handleMouseEnter();
    }

    return () => {
      if (fadeTimer) clearTimeout(fadeTimer);
      if (isActive) {
        sharedEngine.unsubscribe(subscriber);
      }
      card.removeEventListener("mouseenter", handleMouseEnter);
      card.removeEventListener("mouseleave", handleMouseLeave);
      card.removeEventListener("mousemove", handleMouseMove);
      io.disconnect();
      if (sharedResizeObserver) {
        resizeCallbacks.delete(container);
        sharedResizeObserver.unobserve(container);
      }
    };
  }, []);

  const glowBoxShadow =
    glow === "subtle" || glow === "low"
      ? "0 0 12px 1.5px rgba(255, 255, 255, 0.22), 0 0 22px 3px rgba(185, 210, 245, 0.12), inset 0 0 4px 1px rgba(255, 255, 255, 0.18)"
      : glow === "none"
      ? "none"
      : typeof glow === "string" && glow !== "normal"
      ? glow
      : "0 0 22px 3px rgba(255, 255, 255, 0.5), 0 0 40px 6px rgba(185, 210, 245, 0.25), inset 0 0 6px 1px rgba(255, 255, 255, 0.35)";

  return (
    <>
      {/* Soft Ambient White/Silver Specular Sheen just behind the border on hover */}
      <div
        className="pointer-events-none absolute -inset-[1px] z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out will-change-[opacity]"
        style={{
          borderRadius: `${borderRadius}px`,
          boxShadow: glowBoxShadow,
        }}
      />

      {/* White Liquid Metal Procedural WebGL2 Shader Border Layer */}
      <div
        ref={containerRef}
        className="pointer-events-none absolute -inset-[1px] overflow-hidden z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out will-change-[opacity]"
        style={{ borderRadius: `${borderRadius}px` }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      </div>
    </>
  );
}

export const LiquidMetalCardBorder = memo(LiquidMetalCardBorderComponent);
export default LiquidMetalCardBorder;
