"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const DEFAULT_GRADIENTS = [
  "linear-gradient(135deg, #2d1b69 0%, #11998e 100%)",
  "linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)",
  "linear-gradient(135deg, #0f3460 0%, #e94560 100%)",
  "linear-gradient(135deg, #134e5e 0%, #71b280 100%)",
  "linear-gradient(135deg, #2d1b69 0%, #11998e 100%)",
];

const isHexColor = (value: string | null | undefined) => /^#[0-9a-fA-F]{6}$/.test(String(value || "").trim());

const mixHexColors = (startColor: string, endColor: string, ratio: number) => {
  const safeRatio = Math.min(1, Math.max(0, ratio));
  const start = startColor.trim();
  const end = endColor.trim();

  if (!isHexColor(start) || !isHexColor(end)) {
    return startColor;
  }

  const startRgb = [1, 3, 5].map((index) => parseInt(start.slice(index, index + 2), 16));
  const endRgb = [1, 3, 5].map((index) => parseInt(end.slice(index, index + 2), 16));
  const mixed = startRgb.map((channel, index) => Math.round(channel + (endRgb[index] - channel) * safeRatio));

  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
};

export function buildGradientFlowGradients(startColor?: string | null, endColor?: string | null) {
  const start = isHexColor(startColor) ? String(startColor).trim() : "#6366f1";
  const end = isHexColor(endColor) ? String(endColor).trim() : "#8b5cf6";
  const blend = mixHexColors(start, end, 0.5);
  const highlight = mixHexColors(start, "#ffffff", 0.2);
  const shadow = mixHexColors(end, "#111827", 0.3);

  return [
    `linear-gradient(135deg, ${start} 0%, ${end} 100%)`,
    `linear-gradient(135deg, ${end} 0%, ${blend} 55%, ${start} 100%)`,
    `radial-gradient(circle at top left, ${highlight} 0%, ${start} 36%, ${end} 100%)`,
    `linear-gradient(160deg, ${shadow} 0%, ${start} 48%, ${highlight} 100%)`,
    `radial-gradient(circle at bottom right, ${end} 0%, ${blend} 50%, ${start} 100%)`,
  ];
}

export function GradientFlowBackground({ className, gradients }: { className?: string; gradients?: string[] }) {
  const animationGradients = gradients && gradients.length > 0 ? gradients : DEFAULT_GRADIENTS;

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <motion.div
        className="absolute inset-0"
        style={{ background: animationGradients[0] }}
        animate={{ background: animationGradients }}
        transition={{ delay: 0.5, duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
