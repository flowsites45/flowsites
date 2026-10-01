import React, { useRef, useEffect, useState, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Heart, Copy, Check, Play } from "lucide-react";
import { OpticalButton } from "../ui/OpticalGlass.jsx";
import LiquidMetalButton from "../ui/LiquidMetalButton.jsx";
import LiquidMetalCardBorder from "../ui/LiquidMetalCardBorder.jsx";
import { parseCategories } from "../../lib/categories.js";

function formatLikes(value) {
  if (typeof value === "number" && value >= 1000) {
    return (value / 1000).toFixed(1) + "k";
  }
  return value + "";
}

/**
 * Optimized, Memoized Template Card Component
 * - Viewport-aware video playback & lazy loading (IntersectionObserver)
 * - Isolated hover animations (CSS-driven, zero React parent re-renders)
 * - Memoized props to prevent sibling cards from re-rendering on copy/like
 * - Eager loading for above-the-fold cards, lazy decoding for below-the-fold
 */
function TemplateCardComponent({
  template,
  index = 0,
  isLiked = false,
  isCopied = false,
  displayLikes = 0,
  accessible = true,
  badgeLabel = null,
  isBgAsset = false,
  isHorizontal = false,
  onLike,
  onCopy,
  onPreview,
  onGoUnlimited,
}) {
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const [isInViewport, setIsInViewport] = useState(index < 6);
  const isEager = index < 6;

  // Viewport intersection observer: pause video when off-screen to save hardware decoders
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsInViewport(visible);
        if (videoRef.current) {
          if (visible) {
            videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
          }
        }
      },
      { rootMargin: "300px 0px", threshold: 0.01 }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const handleLikeClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (onLike) onLike(e, template.id);
    },
    [onLike, template.id]
  );

  const handleCopyClick = useCallback(() => {
    if (onCopy) onCopy(template);
  }, [onCopy, template]);

  const handlePreviewClick = useCallback(() => {
    if (onPreview) onPreview(template);
  }, [onPreview, template]);

  return (
    <div
      ref={cardRef}
      className={`group relative rounded-[20px] overflow-hidden bg-gradient-to-b from-white/[0.08] to-transparent border border-white/10 border-t-white/20 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.3)] hover:border-white/15 hover:-translate-y-1.5 will-change-transform ${
        isHorizontal ? "shrink-0 w-[280px] sm:w-[320px] snap-start" : ""
      }`}
    >
      {/* White Liquid Metal Procedural WebGL2 Shader Border Effect (Active on Hover) */}
      <LiquidMetalCardBorder />

      {/* Image Area — aligned uniformly to aspect ratio, showing full original media without crop */}
      <div
        onClick={handlePreviewClick}
        className="relative aspect-[16/10] overflow-hidden bg-[#0a0a0c] isolate flex items-center justify-center border-b border-white/5 cursor-pointer"
      >
        {template.video ? (
          <video
            ref={videoRef}
            src={isInViewport || isEager ? template.video : undefined}
            poster={template.image && template.image.startsWith("http") ? template.image : undefined}
            className="w-full h-full object-contain block transition-opacity duration-500 group-hover:opacity-90"
            autoPlay
            loop
            muted
            playsInline
            preload={isEager ? "auto" : "none"}
            onLoadedData={(e) => {
              if (isInViewport || isEager) {
                e.currentTarget.play().catch(() => {});
              }
            }}
          />
        ) : (
          <img
            src={template.image}
            alt={template.title}
            className="w-full h-full object-contain block transition-opacity duration-500 group-hover:opacity-90"
            loading={isEager ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={isEager ? "high" : "auto"}
          />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none" />

        {/* Like badge — always accessible on mobile/touch, revealed on hover on desktop */}
        <button
          type="button"
          onClick={handleLikeClick}
          className="lg-badge absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 cursor-pointer z-10"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${
              isLiked ? "fill-[#f87171] text-[#f87171]" : "text-white/70"
            }`}
          />
          <span className={isLiked ? "text-[#f87171]" : "text-white/80"}>
            {formatLikes(displayLikes)}
          </span>
        </button>

        {/* Hover preview button — Optical Glass Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-10">
          <div className="h-[46px] min-w-[140px]">
            <OpticalButton
              onClick={handlePreviewClick}
              label={template.video ? "Play Preview" : "Preview"}
              icon={template.video ? <Play className="w-4 h-4 fill-white text-white" /> : null}
              material="clear"
              surface="dark"
              fontSize="14px"
              padding="10px 22px"
              style={{ height: "46px", width: "100%", "--og-min-height": "46px" }}
            />
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base sm:text-lg text-white leading-tight mb-0.5 sm:mb-1 truncate">
              {template.title}
            </h3>
            <p
              className="text-[11px] sm:text-xs text-white/40 font-medium truncate"
              title={parseCategories(template.category).join(", ")}
            >
              {parseCategories(template.category).join(" • ") || "Template"}
            </p>
          </div>

          {/* Access-aware Copy button */}
          {!accessible && badgeLabel ? (
            <div className="shrink-0 h-[38px] min-w-[105px]">
              <LiquidMetalButton
                onClick={onGoUnlimited}
                labelStyle={{ fontSize: "12px", fontWeight: "600", letterSpacing: "0.02em" }}
              >
                {badgeLabel}
              </LiquidMetalButton>
            </div>
          ) : (
            <div className="shrink-0 h-[38px] min-w-[96px]">
              <OpticalButton
                onClick={handleCopyClick}
                label={isCopied ? (isBgAsset ? "Copied URL" : "Copied") : (isBgAsset ? "Copy URL" : "Copy")}
                icon={isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                material="clear"
                surface="dark"
                fontSize="12px"
                padding="6px 14px"
                style={{ height: "38px", width: "100%", "--og-min-height": "38px" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// React.memo comparison: only re-render if this specific card's state changed
export const TemplateCard = memo(TemplateCardComponent, (prev, next) => {
  return (
    prev.template.id === next.template.id &&
    prev.template.likes === next.template.likes &&
    prev.template.title === next.template.title &&
    prev.template.image === next.template.image &&
    prev.template.video === next.template.video &&
    prev.isLiked === next.isLiked &&
    prev.isCopied === next.isCopied &&
    prev.displayLikes === next.displayLikes &&
    prev.accessible === next.accessible &&
    prev.badgeLabel === next.badgeLabel &&
    prev.isBgAsset === next.isBgAsset &&
    prev.isHorizontal === next.isHorizontal &&
    prev.index === next.index
  );
});

export default TemplateCard;
