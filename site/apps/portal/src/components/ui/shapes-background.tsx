"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
  moveRange = 30,
  xRange = 0,
  rotateRange = 0,
  duration = 8,
  scaleRange = [1, 1],
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
  moveRange?: number;
  xRange?: number;
  rotateRange?: number;
  duration?: number;
  scaleRange?: [number, number];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -150, rotate: rotate - 15, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, rotate, scale: 1 }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{
          y: [0, moveRange, -moveRange * 0.4, moveRange * 0.7, 0],
          x: [0, xRange, -xRange * 0.5, xRange * 0.3, 0],
          rotate: [0, rotateRange, -rotateRange * 0.6, rotateRange * 0.4, 0],
          scale: [scaleRange[0], scaleRange[1], scaleRange[0], scaleRange[1], scaleRange[0]],
        }}
        transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
        style={{ width, height }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border-2 border-white/[0.15]",
            "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
          )}
        />
      </motion.div>
    </motion.div>
  );
}

export function ShapesBackground({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />

      <ElegantShape
        delay={0.3}
        width={600}
        height={140}
        rotate={12}
        gradient="from-indigo-500/[0.15]"
        className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        moveRange={40}
        xRange={25}
        rotateRange={8}
        duration={7}
        scaleRange={[1, 1.08]}
      />
      <ElegantShape
        delay={0.5}
        width={500}
        height={120}
        rotate={-15}
        gradient="from-rose-500/[0.15]"
        className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        moveRange={35}
        xRange={-30}
        rotateRange={-10}
        duration={9}
        scaleRange={[0.95, 1.05]}
      />
      <ElegantShape
        delay={0.4}
        width={300}
        height={80}
        rotate={-8}
        gradient="from-violet-500/[0.15]"
        className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        moveRange={50}
        xRange={20}
        rotateRange={12}
        duration={6}
        scaleRange={[1, 1.12]}
      />
      <ElegantShape
        delay={0.6}
        width={200}
        height={60}
        rotate={20}
        gradient="from-amber-500/[0.15]"
        className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        moveRange={45}
        xRange={-15}
        rotateRange={-15}
        duration={5}
        scaleRange={[0.9, 1.1]}
      />
      <ElegantShape
        delay={0.7}
        width={150}
        height={40}
        rotate={-25}
        gradient="from-cyan-500/[0.15]"
        className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
        moveRange={55}
        xRange={30}
        rotateRange={18}
        duration={4.5}
        scaleRange={[0.92, 1.15]}
      />
      <ElegantShape
        delay={0.8}
        width={250}
        height={70}
        rotate={15}
        gradient="from-emerald-500/[0.12]"
        className="right-[30%] md:right-[35%] bottom-[20%] md:bottom-[25%]"
        moveRange={38}
        xRange={-22}
        rotateRange={10}
        duration={6.5}
        scaleRange={[0.95, 1.1]}
      />
      <ElegantShape
        delay={0.9}
        width={180}
        height={50}
        rotate={-30}
        gradient="from-pink-500/[0.12]"
        className="left-[45%] md:left-[50%] top-[40%] md:top-[45%]"
        moveRange={42}
        xRange={18}
        rotateRange={-14}
        duration={5.5}
        scaleRange={[1, 1.08]}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />
    </div>
  );
}
