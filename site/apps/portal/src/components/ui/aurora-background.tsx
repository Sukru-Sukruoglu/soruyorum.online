"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode, useMemo } from "react";

export const AURORA_COLOR_PRESETS: Record<string, { label: string; colors: [string, string, string, string, string] }> = {
  blue: { label: "Mavi", colors: ["#3b82f6", "#a5b4fc", "#93c5fd", "#ddd6fe", "#60a5fa"] },
  green: { label: "Yeşil", colors: ["#22c55e", "#86efac", "#6ee7b7", "#bbf7d0", "#34d399"] },
  red: { label: "Kırmızı", colors: ["#ef4444", "#fca5a5", "#f87171", "#fecaca", "#fb923c"] },
  purple: { label: "Mor", colors: ["#a855f7", "#c4b5fd", "#d8b4fe", "#e9d5ff", "#818cf8"] },
  pink: { label: "Pembe", colors: ["#ec4899", "#f9a8d4", "#f472b6", "#fbcfe8", "#e879f9"] },
  cyan: { label: "Camgöbeği", colors: ["#06b6d4", "#67e8f9", "#22d3ee", "#a5f3fc", "#38bdf8"] },
  orange: { label: "Turuncu", colors: ["#f97316", "#fdba74", "#fb923c", "#fed7aa", "#fbbf24"] },
};

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children?: ReactNode;
  showRadialGradient?: boolean;
  colorPreset?: string;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  colorPreset = "blue",
  ...props
}: AuroraBackgroundProps) => {
  const colors = useMemo(() => {
    const preset = AURORA_COLOR_PRESETS[colorPreset] || AURORA_COLOR_PRESETS.blue;
    return preset.colors;
  }, [colorPreset]);

  const auroraGradient = `repeating-linear-gradient(100deg,${colors[0]} 10%,${colors[1]} 15%,${colors[2]} 20%,${colors[3]} 25%,${colors[4]} 30%)`;

  return (
    <div
      className={cn(
        "relative flex flex-col h-full w-full items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-slate-950 transition-bg",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          style={{
            "--aurora": auroraGradient,
          } as React.CSSProperties}
          className={cn(
            `
            [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)]
            [background-image:var(--white-gradient),var(--aurora)]
            dark:[background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px] invert dark:invert-0
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
            after:dark:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            pointer-events-none
            absolute -inset-[10px] opacity-50 will-change-transform`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`
          )}
        ></div>
      </div>
      {children}
    </div>
  );
};
