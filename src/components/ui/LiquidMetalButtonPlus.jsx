import React, { useRef, useEffect, useState, useId } from "react";

const se = `attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;

const ce = `
precision highp float;
varying vec2 uv;
uniform float time, pixels, tube, flow, dispersion, glow, warmth, hover, hoverTone, hoverIntensity, press, response, release;
uniform vec2 pointer;
const float PI=3.14159265;
float pool(float a,float b,float sharp){return exp((cos(a-b)-1.)*sharp);}
float studio(vec3 r,float a,float q,float shift){
    float f=sin(a*2.-time*.53)+.28*sin(3.*a+time*.31)+q*.52+r.z*.12+shift;
    float main=smoothstep(-.5,-.28,f)-smoothstep(.37,.57,f);
    float strip=smoothstep(.84,.95,f);
    float curve=.5+.5*r.z;
    return .12+.75*main+.65*strip+.12*curve;
}
void main(){
    vec2 p=(vec2(uv.x,1.-uv.y)*2.-1.)*1.2;
    float r=max(length(p),.0001);
    float a=atan(p.y,p.x);
    float phase=time*.65;
    float aim=atan(pointer.y+.0001,pointer.x+.0001);
    float attraction=pool(a,aim,2.8)*hover;
    float wave=sin(3.*a-release*11.)*sin(PI*release)*exp(-release*2.7);
    float rip=flow*(.010*sin(3.*a-phase*1.3)+.006*sin(5.*a+phase*.8));
    float radius=.81+rip+attraction*.018*response-press*.012*response+wave*.035*response;
    float width=tube*(1.+flow*.16*sin(2.*a-phase)+attraction*.19*response+press*.24*response);
    float q=(r-radius)/max(width,.018);
    float aa=2.64/max(pixels,1.);
    float coverage=1.-smoothstep(width-aa,width+aa,abs(r-radius));
    float z=sqrt(max(.0001,1.-clamp(q*q,0.,1.)));
    vec2 tangent=vec2(-p.y,p.x)/r;
    vec3 normal=normalize(vec3(p/r*clamp(q,-1.,1.)+tangent*(.10*flow*sin(3.*a-phase)+wave*.35),z));
    vec3 reflected=reflect(vec3(0.,0.,-1.),normal);
    float shift=dispersion*(.08+.13*pool(a,phase+.7,2.));
    vec3 chrome=vec3(studio(reflected,a,q,shift),studio(reflected,a,q,0.),studio(reflected,a,q,-shift));
    float hot=pool(a,phase-1.9,12.)+pool(a,-phase*.71+1.2,20.)*.7;
    chrome+=vec3(.75,.87,1.)*hot*pow(z,2.)*.72;
    float hoverCore=attraction*pow(z,4.)*hoverIntensity;
    vec3 hoverTarget=mix(vec3(.08,.12,.19),vec3(1.),step(0.,hoverTone));
    chrome=mix(chrome,hoverTarget,hoverCore*mix(.50,.46,step(0.,hoverTone)));
    chrome*=mix(vec3(1.),vec3(1.14,.96,.72),max(0.,warmth));
    chrome*=mix(vec3(1.),vec3(.78,.93,1.13),max(0.,-warmth));
    chrome=mix(chrome,vec3(.94,.98,1.),pow(abs(clamp(q,-1.,1.)),14.)*.38);
    float halo=exp(-pow((r-radius)/(width*2.8),2.))*hot*glow*.21*(1.-smoothstep(1.08,1.2,r));
    vec3 haloColor=mix(vec3(.65,.79,1.),vec3(1.,.88,.65),.5+.5*sin(a+phase));
    float alpha=coverage+(1.-coverage)*halo;
    vec3 col=clamp(chrome,0.,1.)*coverage+haloColor*(1.-coverage)*halo;
    gl_FragColor=vec4(col,alpha);
}`;

const defaultIcon = {
  glyph: "sparkle",
  size: 62,
  glyphSize: 25,
  color: "#F8FAFC",
  fill: "#353B43",
  position: "left",
};

const defaultMetal = {
  thickness: 5.2,
  flow: 0.65,
  dispersion: 0.65,
  glow: 0.5,
  warmth: 0,
};

const defaultMotion = {
  mode: "ambient",
  speed: 0.8,
  attraction: 0.7,
  response: 0.65,
  release: true,
};

const defaultHoverStyle = {
  tone: "auto",
  intensity: 0.72,
};

const defaultGlass = {
  blur: 18,
  edge: 0.7,
};

const defaultEdge = {
  enabled: true,
  width: 3.2,
  intensity: 1,
  speed: 1,
  prism: 0.8,
  flow: 0.75,
};

const defaultIconStyle = {
  finish: "chrome",
  animated: true,
  angle: 135,
  highlight: "#FFFFFF",
  shade: "#64748C",
  accent: "#ABCFFF",
};

const defaultFont = {
  fontFamily: "Inter, sans-serif",
  fontSize: 19,
  fontWeight: 500,
  lineHeight: "1.2em",
  letterSpacing: "-.025em",
};

function IconGlyph({ name, size, paint }) {
  const glyphs = {
    sparkle: (
      <path
        d="M12 1.8C14.2 8.7 15.3 9.8 22.2 12 15.3 14.2 14.2 15.3 12 22.2 9.8 15.3 8.7 14.2 1.8 12 8.7 9.8 9.8 8.7 12 1.8Z"
        fill={paint || "currentColor"}
        stroke="none"
      />
    ),
    home: (
      <path
        d="m2.5 10 9.5-8 9.5 8v2h-3v9H14v-6h-4v6H5.5v-9h-3Z"
        fill={paint || "currentColor"}
        stroke="none"
      />
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    "arrow-up-right": <path d="M6 18 18 6M6 6h12v12" />,
    plus: <path d="M12 4v16M4 12h16" />,
    play: <path d="m8 5 11 7-11 7Z" fill={paint || "currentColor"} stroke="none" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    chevron: <path d="m6 9 6 6 6-6" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={paint || "currentColor"}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {glyphs[name] || glyphs.sparkle}
    </svg>
  );
}

export default function LiquidMetalButtonPlus({
  label = "Explore Templates",
  link = "",
  newTab = false,
  theme = "obsidian",
  fill = "rgba(218,229,238,0.18)",
  textColor,
  font,
  radius = "100px",
  padding,
  gap = 13,
  trailing = "none",
  shadow = "0px 12px 24px -12px rgba(0,0,0,0.45)",
  disabled = false,
  accessibilityLabel = "",
  onTap,
  onClick,
  style = {},
  icon: iconProp,
  showIcon = true,
  metal: metalProp,
  hoverStyle: hoverStyleProp,
  motion: motionProp,
  glass: glassProp,
  edge: edgeProp,
  iconStyle: iconStyleProp,
  className = "",
}) {
  const iconConfig = { ...defaultIcon, ...iconProp };
  const metalConfig = { ...defaultMetal, ...metalProp };
  const hoverConfig = { ...defaultHoverStyle, ...hoverStyleProp };
  const motionConfig = { ...defaultMotion, ...motionProp };
  const glassConfig = { ...defaultGlass, ...glassProp };
  const edgeConfig = { ...defaultEdge, ...edgeProp };
  const iconStyleConfig = { ...defaultIconStyle, ...iconStyleProp };

  const rawId = useId();
  const iconGradientId = `orbit-icon-${rawId.replace(/:/g, "")}`;

  const gradientRef = useRef(null);
  const [imageSrc, setImageSrc] = useState("");
  const buttonRef = useRef(null);
  const canvasRef = useRef(null);
  const animationContextRef = useRef(null);

  const interactionState = useRef({
    x: -0.5,
    y: -0.5,
    sx: 0.5,
    sy: 0.5,
    hovering: false,
    focused: false,
    pressed: false,
    release: 1,
  });

  const timeRef = useRef(1.4);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [, setRerenderTrigger] = useState(0);

  const isPearl = theme === "pearl";
  const hoverTone =
    hoverConfig.tone === "auto"
      ? isPearl
        ? "dark"
        : "light"
      : hoverConfig.tone;
  const isDarkHover = hoverTone === "dark";
  const finalTextColor = textColor || (isPearl ? "#262C34" : "#F6F8FC");

  const surfaceBackground =
    theme === "custom"
      ? fill
      : isPearl
      ? "rgba(246,249,252,.92)"
      : theme === "obsidian"
      ? "rgba(21,24,30,.91)"
      : "rgba(148,165,182,.20)";

  const isInteractive = !disabled;
  const hasCustomFinish = iconStyleConfig.finish !== "original";
  const iconHighlight =
    iconStyleConfig.finish === "custom" ? iconStyleConfig.highlight : "#FFFFFF";
  const iconShade =
    iconStyleConfig.finish === "custom"
      ? iconStyleConfig.shade
      : iconStyleConfig.finish === "prism"
      ? "#668DC2"
      : "#7A879B";
  const iconAccent =
    iconStyleConfig.finish === "custom"
      ? iconStyleConfig.accent
      : iconStyleConfig.finish === "prism"
      ? "#EEB596"
      : "#D7E4F5";

  const iconGradientCss = `linear-gradient(${iconStyleConfig.angle}deg,${iconHighlight} 8%,${iconShade} 31%,${iconAccent} 43%,${iconHighlight} 52%,${iconHighlight} 59%,${iconShade} 78%,${iconHighlight} 96%)`;
  const isCustomImage = iconConfig.glyph === "image" && iconConfig.image?.src;

  useEffect(() => {
    if (
      !isCustomImage ||
      !hasCustomFinish ||
      typeof window === "undefined" ||
      !(
        window.CSS?.supports("mask-image", "linear-gradient(white,white)") ||
        window.CSS?.supports("-webkit-mask-image", "linear-gradient(white,white)")
      )
    ) {
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!cancelled) setImageSrc(iconConfig.image.src);
    };
    img.src = iconConfig.image.src;
    return () => {
      cancelled = true;
      img.onload = null;
    };
  }, [isCustomImage, hasCustomFinish, iconConfig.image?.src]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(mediaQuery.matches);
    updateMotion();
    mediaQuery.addEventListener("change", updateMotion);
    return () => mediaQuery.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => {
    if (disabled) {
      interactionState.current = {
        x: -0.5,
        y: -0.5,
        sx: 0.5,
        sy: 0.5,
        hovering: false,
        focused: false,
        pressed: false,
        release: 1,
      };
      buttonRef.current?.setAttribute("data-active", "false");
      buttonRef.current?.setAttribute("data-pressed", "false");
    }
  }, [disabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const button = buttonRef.current;
    if (!button || typeof window === "undefined") return;

    let gl = null;
    let cleanupGL = () => {};
    const uniformLocations = {};
    let setUniform1f = () => {};

    if (canvas) {
      canvas.style.opacity = "0";
      try {
        gl =
          canvas.getContext("webgl", {
            alpha: true,
            premultipliedAlpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: "low-power",
          }) ||
          canvas.getContext("experimental-webgl", {
            alpha: true,
            premultipliedAlpha: true,
          });
      } catch {
        gl = null;
      }

      if (gl) {
        const compileShader = (type, source) => {
          const shader = gl.createShader(type);
          if (!shader) return null;
          gl.shaderSource(shader, source);
          gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.warn("LiquidMetalButtonPlus shader error:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
          }
          return shader;
        };

        const vertShader = compileShader(gl.VERTEX_SHADER, se);
        const fragShader = compileShader(gl.FRAGMENT_SHADER, ce);
        if (vertShader && fragShader) {
          const program = gl.createProgram();
          const positionBuffer = gl.createBuffer();
          if (program && positionBuffer) {
            gl.attachShader(program, vertShader);
            gl.attachShader(program, fragShader);
            gl.linkProgram(program);

            cleanupGL = () => {
              gl.deleteShader(vertShader);
              gl.deleteShader(fragShader);
              gl.deleteBuffer(positionBuffer);
              gl.deleteProgram(program);
            };

            if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
              gl.useProgram(program);
              gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
              gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
                gl.STATIC_DRAW
              );

              const posAttr = gl.getAttribLocation(program, "position");
              gl.enableVertexAttribArray(posAttr);
              gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

              [
                "time",
                "pixels",
                "tube",
                "flow",
                "dispersion",
                "glow",
                "warmth",
                "hover",
                "hoverTone",
                "hoverIntensity",
                "press",
                "response",
                "release",
                "pointer",
              ].forEach((name) => {
                uniformLocations[name] = gl.getUniformLocation(program, name);
              });

              setUniform1f = (name, val) => gl.uniform1f(uniformLocations[name], val);
              setUniform1f("tube", Math.min(0.16, Math.max(0.022, metalConfig.thickness / iconConfig.size)));
              setUniform1f("flow", metalConfig.flow);
              setUniform1f("dispersion", metalConfig.dispersion);
              setUniform1f("glow", metalConfig.glow);
              setUniform1f("warmth", metalConfig.warmth);
              setUniform1f("response", motionConfig.response);
              setUniform1f("hoverTone", isDarkHover ? -1 : 1);
              setUniform1f("hoverIntensity", hoverConfig.intensity);
            } else {
              cleanupGL();
              gl = null;
            }
          } else {
            if (vertShader) gl.deleteShader(vertShader);
            if (fragShader) gl.deleteShader(fragShader);
            if (program) gl.deleteProgram(program);
            if (positionBuffer) gl.deleteBuffer(positionBuffer);
            gl = null;
          }
        } else {
          if (vertShader) gl.deleteShader(vertShader);
          if (fragShader) gl.deleteShader(fragShader);
          gl = null;
        }
      }
    }

    let rafId = 0;
    let lastTime = 0;
    let isVisible = true;
    let isDestroyed = false;
    let isContextLost = false;

    let hoverLerp = 0;
    let pressLerp = 0;
    let pointerX = -0.5;
    let pointerY = -0.5;
    let surfaceX = 0.5;
    let surfaceY = 0.5;

    const canAnimate = isInteractive && !reducedMotion && motionConfig.mode !== "off";

    const drawFrame = () => {
      if (isDestroyed || isContextLost) return;

      if (gl && canvas) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        setUniform1f("pixels", canvas.width);
        setUniform1f("time", timeRef.current);
        setUniform1f("hover", hoverLerp * motionConfig.attraction);
        setUniform1f("press", pressLerp);
        setUniform1f("release", canAnimate ? interactionState.current.release : 1);
        gl.uniform2f(uniformLocations.pointer, pointerX, pointerY);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        canvas.style.opacity = "1";
        button.setAttribute("data-renderer", "webgl");
      }

      const edgeTime = timeRef.current * edgeConfig.speed;
      button.style.setProperty("--orb-phase", `${edgeTime * 46 - 85}deg`);
      button.style.setProperty("--orb-counter", `${-edgeTime * 31 + 75}deg`);
      button.style.setProperty(
        "--orb-pool-x",
        `${50 + Math.sin(edgeTime * 0.73) * 16 * edgeConfig.flow}%`
      );
      button.style.setProperty(
        "--orb-pool-y",
        `${50 + Math.cos(edgeTime * 0.57) * 22 * edgeConfig.flow}%`
      );

      const pull = hoverLerp * motionConfig.attraction * hoverConfig.intensity;
      const baseX = 50 + Math.cos(edgeTime * 0.91) * 48;
      const baseY = 50 + Math.sin(edgeTime * 0.91) * 48;
      button.style.setProperty("--orb-light-x", `${baseX + (surfaceX * 100 - baseX) * pull}%`);
      button.style.setProperty("--orb-light-y", `${baseY + (surfaceY * 100 - baseY) * pull}%`);
      button.style.setProperty("--orb-wake-x", `${surfaceX * 100}%`);
      button.style.setProperty("--orb-wake-y", `${surfaceY * 100}%`);

      ["top", "right", "bottom", "left"].forEach((side, idx) => {
        const factor = 1 + Math.sin(edgeTime * 1.13 + idx * Math.PI * 0.5) * 0.28 * edgeConfig.flow;
        button.style.setProperty(`--orb-edge-${side}`, `${edgeConfig.width * factor}px`);
      });

      if (showIcon) {
        const iconShift = iconStyleConfig.animated ? Math.sin(timeRef.current * 0.8) * 35 : 0;
        const angleRad = (iconStyleConfig.angle * Math.PI) / 180;
        button.style.setProperty(
          "--orb-icon-shift-x",
          `${50 + iconShift * Math.sin(angleRad)}%`
        );
        button.style.setProperty(
          "--orb-icon-shift-y",
          `${50 - iconShift * Math.cos(angleRad)}%`
        );
        gradientRef.current?.setAttribute(
          "gradientTransform",
          `rotate(${iconStyleConfig.angle - 90 + iconShift * 0.45} .5 .5)`
        );
      }
    };

    const animateLoop = (now) => {
      rafId = 0;
      if (isDestroyed || isContextLost || !isVisible || document.hidden || !canAnimate) {
        lastTime = 0;
        return;
      }
      const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 1 / 60;
      lastTime = now;

      const state = interactionState.current;
      const isTargetHover = state.hovering || state.focused;
      const decayHover = 1 - Math.exp(-dt * 10);

      hoverLerp += ((isTargetHover ? 1 : 0) - hoverLerp) * decayHover;
      pressLerp += ((state.pressed ? 1 : 0) - pressLerp) * (1 - Math.exp(-dt * 18));
      pointerX += (state.x - pointerX) * decayHover;
      pointerY += (state.y - pointerY) * decayHover;
      surfaceX += (state.sx - surfaceX) * decayHover;
      surfaceY += (state.sy - surfaceY) * decayHover;

      state.release = Math.min(1, state.release + dt * 1.35);

      if (motionConfig.mode === "ambient" || isTargetHover) {
        timeRef.current += dt * motionConfig.speed;
      }

      drawFrame();

      if (
        motionConfig.mode === "ambient" ||
        isTargetHover ||
        state.pressed ||
        state.release < 1 ||
        hoverLerp > 0.002 ||
        pressLerp > 0.002
      ) {
        rafId = requestAnimationFrame(animateLoop);
      } else {
        lastTime = 0;
      }
    };

    const wakeAnimation = () => {
      if (!rafId && canAnimate && isVisible && !document.hidden && !isContextLost && !isDestroyed) {
        rafId = requestAnimationFrame(animateLoop);
      }
    };

    animationContextRef.current = { wake: wakeAnimation };

    const updateSize = () => {
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.min(512, Math.round(rect.width * dpr)));
        canvas.height = canvas.width;
      }
      drawFrame();
      wakeAnimation();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
        rafId = 0;
        lastTime = 0;
      } else {
        wakeAnimation();
      }
    };

    const handleContextLost = (e) => {
      e.preventDefault();
      isContextLost = true;
      if (canvas) canvas.style.opacity = "0";
      button.setAttribute("data-renderer", "fallback");
      cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const handleContextRestored = () => {
      setRerenderTrigger((c) => c + 1);
    };

    const resizeObserver = canvas ? new ResizeObserver(updateSize) : null;
    const intersectionObserver = new IntersectionObserver((entries) => {
      isVisible = entries[0]?.isIntersecting ?? false;
      if (isVisible) {
        wakeAnimation();
      } else {
        cancelAnimationFrame(rafId);
        rafId = 0;
        lastTime = 0;
      }
    });

    if (canvas && resizeObserver) resizeObserver.observe(canvas);
    intersectionObserver.observe(button);
    document.addEventListener("visibilitychange", handleVisibility);
    if (canvas) {
      canvas.addEventListener("webglcontextlost", handleContextLost);
      canvas.addEventListener("webglcontextrestored", handleContextRestored);
    }

    updateSize();

    return () => {
      isDestroyed = true;
      cancelAnimationFrame(rafId);
      animationContextRef.current = null;
      resizeObserver?.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      if (canvas) {
        canvas.removeEventListener("webglcontextlost", handleContextLost);
        canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      }
      button.setAttribute("data-renderer", "fallback");
      cleanupGL();
    };
  }, [
    disabled,
    reducedMotion,
    iconConfig.size,
    metalConfig.thickness,
    metalConfig.flow,
    metalConfig.dispersion,
    metalConfig.glow,
    metalConfig.warmth,
    isDarkHover,
    hoverConfig.intensity,
    motionConfig.mode,
    motionConfig.speed,
    motionConfig.attraction,
    motionConfig.response,
    edgeConfig.speed,
    edgeConfig.width,
    edgeConfig.flow,
    iconStyleConfig.angle,
    iconStyleConfig.animated,
  ]);

  const updateActiveState = () => {
    buttonRef.current?.setAttribute(
      "data-active",
      String(interactionState.current.hovering || interactionState.current.focused)
    );
    animationContextRef.current?.wake();
  };

  const setPressedState = (pressed) => {
    if (pressed && disabled) return;
    interactionState.current.pressed = pressed;
    buttonRef.current?.setAttribute("data-pressed", String(pressed));
    animationContextRef.current?.wake();
  };

  const releasePressed = () => {
    setPressedState(false);
    if (!disabled && motionConfig.release) {
      interactionState.current.release = 0;
    }
    animationContextRef.current?.wake();
  };

  const handlePointerMovement = (e) => {
    if (disabled) return;
    const targetRect =
      canvasRef.current?.getBoundingClientRect() || e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - targetRect.left) / Math.max(1, targetRect.width)) * 2 - 1;
    const ny = ((e.clientY - targetRect.top) / Math.max(1, targetRect.height)) * 2 - 1;
    const dist = Math.max(1, Math.hypot(nx, ny));

    interactionState.current.x = nx / dist;
    interactionState.current.y = ny / dist;

    const btnRect = e.currentTarget.getBoundingClientRect();
    interactionState.current.sx = Math.min(
      1,
      Math.max(0, (e.clientX - btnRect.left) / Math.max(1, btnRect.width))
    );
    interactionState.current.sy = Math.min(
      1,
      Math.max(0, (e.clientY - btnRect.top) / Math.max(1, btnRect.height))
    );

    animationContextRef.current?.wake();
  };

  const Tag = link ? "a" : "button";
  const overlayStyle = {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    pointerEvents: "none",
  };

  const resolvedPadding =
    padding !== undefined ? padding : showIcon ? "8px 22px 8px 8px" : "12px 28px";

  const rootStyles = {
    "--orb-hover-intensity": hoverConfig.intensity,
    "--orb-hover-core": isDarkHover ? "rgba(24,36,58,.34)" : "rgba(240,249,255,.30)",
    "--orb-hover-mid": isDarkHover ? "rgba(66,96,138,.16)" : "rgba(167,203,255,.10)",
    "--orb-hover-shadow": isDarkHover ? "rgba(26,46,78,.18)" : "rgba(216,233,255,.10)",
    "--orb-hover-edge": isDarkHover ? "rgba(21,34,57,.96)" : "rgba(255,255,255,.98)",
    "--orb-edge-width": `${edgeConfig.width}px`,
    "--orb-edge-intensity": edgeConfig.intensity,
    "--orb-edge-cool": `color-mix(in srgb,#80B8FF ${edgeConfig.prism * 100}%,#E8F0FA)`,
    "--orb-edge-warm": `color-mix(in srgb,#F4B777 ${edgeConfig.prism * 100}%,#E8F0FA)`,
    position: "relative",
    display: "inline-flex",
    width: "max-content",
    height: "auto",
    maxWidth: "100%",
    minWidth: 0,
    minHeight: showIcon ? 44 : 0,
    margin: 0,
    padding: 0,
    border: 0,
    background: "none",
    color: finalTextColor,
    cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: radius,
    ...style,
  };

  return (
    <Tag
      ref={buttonRef}
      className={`mo-orbit ${className}`}
      data-static={false}
      data-reduced={reducedMotion}
      data-disabled={disabled}
      data-playback={motionConfig.mode}
      data-hover-tone={hoverTone}
      href={link && !disabled ? link : undefined}
      target={link && newTab ? "_blank" : undefined}
      rel={link && newTab ? "noopener noreferrer" : undefined}
      type={link ? undefined : "button"}
      disabled={!link && disabled ? true : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      aria-label={accessibilityLabel || (typeof label === "string" ? label : "Button")}
      onPointerEnter={(e) => {
        if (!disabled && e.pointerType !== "touch") {
          interactionState.current.hovering = true;
          handlePointerMovement(e);
          updateActiveState();
        }
      }}
      onPointerMove={handlePointerMovement}
      onPointerLeave={() => {
        interactionState.current.hovering = false;
        setPressedState(false);
        updateActiveState();
      }}
      onPointerDown={(e) => {
        if (e.button === 0) {
          handlePointerMovement(e);
          setPressedState(true);
        }
      }}
      onPointerUp={() => {
        if (interactionState.current.pressed) releasePressed();
      }}
      onPointerCancel={() => setPressedState(false)}
      onFocus={(e) => {
        if (!disabled && e.currentTarget.matches(":focus-visible")) {
          interactionState.current.focused = true;
          interactionState.current.sx = 0.5;
          interactionState.current.sy = 0.5;
          updateActiveState();
        }
      }}
      onBlur={() => {
        interactionState.current.focused = false;
        setPressedState(false);
        updateActiveState();
      }}
      onKeyDown={(e) => {
        if (!e.repeat && (e.key === "Enter" || (!link && e.key === " "))) {
          setPressedState(true);
        }
      }}
      onKeyUp={(e) => {
        if (e.key === "Enter" || (!link && e.key === " ")) {
          releasePressed();
        }
      }}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          return;
        }
        onTap?.();
        onClick?.(e);
      }}
      style={rootStyles}
    >
      {showIcon && (
        <svg
          width="0"
          height="0"
          aria-hidden="true"
          style={{ position: "absolute", pointerEvents: "none" }}
        >
          <defs>
            <linearGradient
              ref={gradientRef}
              id={iconGradientId}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
              gradientTransform={`rotate(${iconStyleConfig.angle - 90} .5 .5)`}
            >
              <stop offset="0%" stopColor={iconHighlight} />
              <stop offset="28%" stopColor={iconShade} />
              <stop offset="43%" stopColor={iconAccent} />
              <stop offset="54%" stopColor={iconHighlight} />
              <stop offset="65%" stopColor={iconHighlight} />
              <stop offset="84%" stopColor={iconShade} />
              <stop offset="100%" stopColor={iconHighlight} />
            </linearGradient>
          </defs>
        </svg>
      )}

      <span
        className="orb-face"
        style={{
          display: "flex",
          flex: 1,
          minWidth: 0,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: iconConfig.position === "right" ? "row-reverse" : "row",
          gap: showIcon ? gap : 0,
          padding: resolvedPadding,
          position: "relative",
          borderRadius: radius,
          boxShadow: shadow,
          background: surfaceBackground,
          backdropFilter: `blur(${glassConfig.blur}px) saturate(1.2)`,
          WebkitBackdropFilter: `blur(${glassConfig.blur}px) saturate(1.2)`,
        }}
      >
        <span className="orb-decoration orb-wake" aria-hidden="true" style={overlayStyle} />
        <span
          className="orb-decoration"
          style={{
            ...overlayStyle,
            opacity: glassConfig.edge,
            border: `1px solid ${isPearl ? "rgba(255,255,255,.9)" : "rgba(234,241,255,.16)"}`,
            background:
              "linear-gradient(145deg,rgba(255,255,255,.15),transparent 37%,rgba(255,255,255,.025) 70%,rgba(255,255,255,.09))",
            boxShadow:
              "inset 0 1px 2px rgba(255,255,255,.22),inset 0 -1px 3px rgba(0,0,0,.10)",
          }}
        />

        {edgeConfig.enabled && (
          <>
            <span
              className="orb-decoration orb-edge orb-edge-glow"
              style={overlayStyle}
            />
            <span
              className="orb-decoration orb-edge"
              style={{ ...overlayStyle, opacity: edgeConfig.intensity }}
            />
            <span
              className="orb-decoration orb-edge orb-edge-ridge"
              style={overlayStyle}
            />
            <span className="orb-decoration orb-hover-edge" style={overlayStyle} />
          </>
        )}

        {showIcon && (
          <span
            className="orb-medallion"
            style={{
              width: iconConfig.size,
              height: iconConfig.size,
              maxWidth: "100%",
              flexShrink: 0,
              position: "relative",
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
            }}
          >
            <span
              className="orb-disc"
              style={{
                position: "absolute",
                inset: "9.5%",
                borderRadius: "50%",
                background: `linear-gradient(140deg,rgba(255,255,255,.12),transparent 48%,rgba(0,0,0,.18)),${iconConfig.fill}`,
                boxShadow:
                  "inset 0 1px 3px rgba(255,255,255,.25),inset 0 -1px 3px rgba(0,0,0,.6),0 5px 8px -3px rgba(0,0,0,.38)",
              }}
            />

            <span
              className="orb-decoration orb-fallback"
              style={{
                position: "absolute",
                inset: "6%",
                borderRadius: "50%",
                border: "2px solid transparent",
                background:
                  "linear-gradient(140deg,#ecf3ff,#161b26 20%,#eef6ff 43%,#111721 51%,#7187a9 69%,#faf4de 76%,#cadfff) border-box",
                WebkitMask:
                  "linear-gradient(#fff 0 0) padding-box,linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />

            <canvas
              ref={canvasRef}
              className="orb-decoration"
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "-10%",
                left: "-10%",
                width: "120%",
                height: "120%",
                pointerEvents: "none",
              }}
            />

            <span
              className="orb-glyph"
              style={{
                position: "relative",
                color: iconConfig.color,
                filter: "drop-shadow(0 1px 1px rgba(0,0,0,.4))",
                display: "grid",
                placeItems: "center",
              }}
            >
              {isCustomImage ? (
                hasCustomFinish && imageSrc === iconConfig.image.src ? (
                  <span
                    className="orb-icon-paint"
                    aria-hidden="true"
                    style={{
                      display: "block",
                      width: iconConfig.glyphSize,
                      height: iconConfig.glyphSize,
                      backgroundImage: iconGradientCss,
                      WebkitMaskImage: `url(${JSON.stringify(imageSrc)})`,
                      maskImage: `url(${JSON.stringify(imageSrc)})`,
                    }}
                  />
                ) : (
                  <img
                    src={iconConfig.image.src}
                    srcSet={iconConfig.image?.srcSet}
                    alt=""
                    style={{
                      display: "block",
                      width: iconConfig.glyphSize,
                      height: iconConfig.glyphSize,
                      objectFit: "contain",
                    }}
                  />
                )
              ) : (
                <IconGlyph
                  name={iconConfig.glyph}
                  size={iconConfig.glyphSize}
                  paint={hasCustomFinish ? `url(#${iconGradientId})` : undefined}
                />
              )}
            </span>
          </span>
        )}

        {label && (
          <span
            className="orb-label"
            style={{
              ...defaultFont,
              ...font,
              minWidth: 0,
              position: "relative",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: "0 1 auto",
              textAlign: font?.textAlign || (showIcon ? "left" : "center"),
            }}
          >
            {label}
          </span>
        )}

        {trailing !== "none" && label && (
          <span className="orb-tail" style={{ position: "relative", flexShrink: 0 }}>
            <IconGlyph name={trailing} size={18} />
          </span>
        )}
      </span>
    </Tag>
  );
}
