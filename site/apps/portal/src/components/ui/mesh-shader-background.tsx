"use client";

import { MeshGradient } from "@paper-design/shaders-react";

export function MeshShaderBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <MeshGradient
        className="absolute inset-0 w-full h-full"
        colors={["#000000", "#06b6d4", "#0891b2", "#164e63", "#f97316"]}
        speed={0.3}
        backgroundColor="#000000"
      />
      <MeshGradient
        className="absolute inset-0 w-full h-full opacity-60"
        colors={["#000000", "#ffffff", "#06b6d4", "#f97316"]}
        speed={0.2}
        wireframe="true"
        backgroundColor="transparent"
      />
    </div>
  );
}
