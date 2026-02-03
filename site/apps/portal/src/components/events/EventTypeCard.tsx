import { motion } from "framer-motion";
import { LucideIcon, Check } from "lucide-react";

interface EventTypeCardProps {
    title: string;
    gradient: string;
    icon: LucideIcon;
    isPopular?: boolean;
    isNew?: boolean;
    isComingSoon?: boolean;
    onClick?: () => void;
}

export function EventTypeCard({ title, gradient, icon: Icon, isPopular, isNew, isComingSoon, onClick }: EventTypeCardProps) {
    return (
        <motion.div
            onClick={!isComingSoon ? onClick : undefined}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={!isComingSoon ? { y: -8, scale: 1.01 } : { scale: 1.005 }}
            className={`
                group relative aspect-[3/4] rounded-[24px] overflow-hidden cursor-pointer
                ${isComingSoon ? 'grayscale opacity-60 cursor-not-allowed' : 'shadow-2xl hover:shadow-red-900/40'}
            `}
        >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 mix-blend-overlay" />

            {/* Content Container */}
            <div className="relative h-full flex flex-col p-6 z-10">

                {/* Badges */}
                <div className="flex justify-between items-start">
                    {isNew && (
                        <div className="bg-black text-brand-primary text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider border border-brand-primary/30">
                            Yeni
                        </div>
                    )}
                    {isPopular && (
                        <div className="bg-brand-primary text-white text-[10px] font-bold px-2 py-1 rounded ml-auto shadow-lg">
                            Popüler
                        </div>
                    )}
                    {isComingSoon && (
                        <div className="absolute top-4 right-[-30px] rotate-45 bg-black w-32 text-center text-gray-500 text-[10px] font-bold py-1 border-y border-gray-800">
                            YAKINDA
                        </div>
                    )}
                </div>

                {/* Icon Section (70%) */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="relative">
                        {/* Floating Animation */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="relative z-10"
                        >
                            <Icon size={84} className="text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" strokeWidth={1.5} />
                        </motion.div>

                        {/* Icon Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/20 blur-[50px] rounded-full" />
                    </div>
                </div>

                {/* Title Section (30%) */}
                <div className="mt-auto -mx-6 -mb-6 bg-black/40 backdrop-blur-sm p-6 border-t border-white/10 transition-colors group-hover:bg-black/60">
                    <h3 className="text-white font-bold text-center text-xl tracking-tight leading-none group-hover:scale-105 transition-transform duration-300">
                        {title}
                    </h3>
                    <div className="h-0.5 w-0 bg-brand-primary mx-auto mt-3 group-hover:w-16 transition-all duration-500 rounded-full" />
                </div>
            </div>

            {/* Hover Borders */}
            <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 rounded-[24px] transition-all duration-300 pointer-events-none" />
        </motion.div>
    );
}
