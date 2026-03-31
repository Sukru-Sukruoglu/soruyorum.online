"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { DotOrbit, MeshGradient } from "@paper-design/shaders-react";

import { cn } from "@/lib/utils";

import { BackgroundPaperShaders } from "./background-paper-shaders";

const EFFECTS = [
  { id: "paper", label: "Paper" },
  { id: "mesh", label: "Mesh" },
  { id: "dots", label: "Orbit" },
  { id: "combined", label: "Combined" },
] as const;

type EffectId = (typeof EFFECTS)[number]["id"];

export function BackgroundPaperShadersDemo() {
  const [intensity, setIntensity] = useState(1.5);
  const [speed, setSpeed] = useState(1);
  const [activeEffect, setActiveEffect] = useState<EffectId>("paper");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText("pnpm add three @react-three/fiber @paper-design/shaders-react");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text", error);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white">
      {activeEffect === "paper" && (
        <BackgroundPaperShaders className="absolute inset-0" intensity={intensity} speed={speed} />
      )}

      {activeEffect === "mesh" && (
        <MeshGradient
          className="absolute inset-0 h-full w-full"
          colors={["#000000", "#1a1a1a", "#333333", "#ffffff"]}
          speed={speed}
        />
      )}

      {activeEffect === "dots" && (
        <div className="absolute inset-0 bg-black">
          <DotOrbit
            className="h-full w-full"
            colors={["#2f2f2f", "#4b5563", "#9ca3af", "#ffffff"]}
            colorBack="#000000"
            speed={speed * 1.2}
            scale={0.45 + intensity * 0.08}
            size={0.55 + intensity * 0.12}
            spreading={0.9}
          />
        </div>
      )}

      {activeEffect === "combined" && (
        <>
          <MeshGradient
            className="absolute inset-0 h-full w-full"
            colors={["#000000", "#111827", "#1f2937", "#ffffff"]}
            speed={speed * 0.6}
            swirl={0.8}
            distortion={0.9}
          />
          <div className="absolute inset-0 opacity-60">
            <DotOrbit
              className="h-full w-full"
              colors={["#4b5563", "#d1d5db", "#f97316"]}
              colorBack="#000000"
              speed={speed * 1.4}
              scale={0.42 + intensity * 0.06}
              size={0.5 + intensity * 0.08}
            />
          </div>
        </>
      )}

      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto absolute left-6 top-6 flex gap-2 rounded-full border border-white/10 bg-black/40 p-2 backdrop-blur-md">
          {EFFECTS.map((effect) => (
            <button
              key={effect.id}
              type="button"
              onClick={() => setActiveEffect(effect.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                activeEffect === effect.id ? "bg-white text-black" : "bg-white/10 text-white/75 hover:bg-white/20"
              )}
            >
              {effect.label}
            </button>
          ))}
        </div>

        <div className="pointer-events-auto absolute bottom-6 left-6 w-[320px] space-y-4 rounded-3xl border border-white/10 bg-black/45 p-5 backdrop-blur-md">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/50">Speed</label>
            <input
              type="range"
              min="0.3"
              max="2.4"
              step="0.1"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/50">Intensity</label>
            <input
              type="range"
              min="0.6"
              max="2.4"
              step="0.1"
              value={intensity}
              onChange={(event) => setIntensity(Number(event.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="pointer-events-auto absolute bottom-6 right-6 rounded-3xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={copyToClipboard}
            className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
            title="Copy install command"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>pnpm add three @react-three/fiber @paper-design/shaders-react</span>
          </button>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center font-mono text-xs text-white/35">
            <div>background-paper-shaders</div>
            <div className="mt-2">Portal live/join arka planları için hazır.</div>
          </div>
        </div>
      </div>
    </div>
  );
}