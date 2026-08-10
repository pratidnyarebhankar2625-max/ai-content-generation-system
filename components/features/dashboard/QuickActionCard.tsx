"use client";

import { motion } from "framer-motion";

type QuickActionCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  index?: number;
  onClick?: () => void;
};

export default function QuickActionCard({
  title,
  description,
  icon,
  index = 0,
  onClick,
}: QuickActionCardProps) {
  return (
    <motion.button
      whileHover={{ y: -6, boxShadow: "0px 10px 30px rgba(17,54,128,0.08)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onClick}
      className="
        card-shimmer
        primary-glow
        group
        relative
        flex
        flex-col
        items-start
        gap-4
        rounded-[20px]
        border
        border-border
        bg-card
        p-7
        text-left
      "
    >
      {/* Accent strip on hover */}
      <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-r-full bg-[#fe4443] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="inline-flex items-center justify-center rounded-2xl bg-[#113680]/10 p-3.5 text-[#113680] transition-colors duration-300 group-hover:bg-[#113680]/15 group-hover:text-[#113680]">
        {icon}
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-foreground">
          {title}
        </h3>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </motion.button>
  );
}