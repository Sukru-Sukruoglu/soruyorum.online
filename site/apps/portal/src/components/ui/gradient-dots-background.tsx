"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function GradientDotsBackground({ className, backgroundColor = "#030303" }: { className?: string; backgroundColor?: string }) {
  const spacing = 14;
  const dotSize = 10;
  const hexSpacing = spacing * 1.732;

  return (
    <motion.div
      className={cn("absolute inset-0", className)}
      style={{
        backgroundColor,
        backgroundImage: `
          radial-gradient(circle at 50% 50%, transparent 1.5px, ${backgroundColor} 0 ${dotSize}px, transparent ${dotSize}px),
          radial-gradient(circle at 50% 50%, transparent 1.5px, ${backgroundColor} 0 ${dotSize}px, transparent ${dotSize}px),
          radial-gradient(circle at 50% 50%, #f00, transparent 60%),
          radial-gradient(circle at 50% 50%, #0f0, transparent 60%),
          radial-gradient(ellipse at 50% 50%, #00f, transparent 60%)
        `,
        backgroundSize: `
          ${spacing}px ${hexSpacing}px,
          ${spacing}px ${hexSpacing}px,
          200% 200%,
          200% 200%,
          200% ${hexSpacing}px
        `,
        backgroundPosition: `
          0px 0px, ${spacing / 2}px ${hexSpacing / 2}px,
          0% 0%,
          0% 0%,
          0% 0px
        `,
      }}
      animate={{
        backgroundPosition: [
          `0px 0px, ${spacing / 2}px ${hexSpacing / 2}px, 400% 200%, -600% -300%, 200% ${hexSpacing}px`,
          `0px 0px, ${spacing / 2}px ${hexSpacing / 2}px, 0% 0%, 0% 0%, 0% 0%`,
        ],
        filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"],
      }}
      transition={{
        backgroundPosition: { duration: 30, ease: "linear", repeat: Infinity },
        filter: { duration: 8, ease: "linear", repeat: Infinity },
      }}
    />
  );
}
