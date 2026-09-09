"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "accent" | "emerald";
  label?: string;
  ariaLabel?: string;
  className?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  size = "md",
  variant = "accent",
  label,
  ariaLabel,
  className,
}: ToggleSwitchProps) {
  const sizeStyles = {
    sm: { track: "h-5 w-9 p-0.5", thumb: "h-4 w-4", translate: 16 },
    md: { track: "h-7 w-12 p-1", thumb: "h-5 w-5", translate: 20 },
    lg: { track: "h-8 w-14 p-1", thumb: "h-6 w-6", translate: 24 },
  };

  const variantTrackStyles = {
    primary: checked
      ? "bg-[#113680] shadow-[0_0_12px_rgba(17,54,128,0.35)] dark:bg-[#3b82f6] dark:shadow-[0_0_12px_rgba(59,130,246,0.35)]"
      : "bg-slate-200 dark:bg-slate-700/80",
    accent: checked
      ? "bg-[#fe4443] shadow-[0_0_12px_rgba(254,68,67,0.35)]"
      : "bg-slate-200 dark:bg-slate-700/80",
    emerald: checked
      ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
      : "bg-slate-200 dark:bg-slate-700/80",
  };

  const { track, thumb, translate } = sizeStyles[size];

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label || "Toggle switch"}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onChange(!checked);
        }}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          track,
          variantTrackStyles[variant]
        )}
      >
        <motion.div
          className={cn(
            "rounded-full bg-white shadow-md flex items-center justify-center pointer-events-none",
            thumb
          )}
          animate={{
            x: checked ? translate : 0,
            scale: checked ? 1.05 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      </button>
      {label && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) onChange(!checked);
          }}
          className="cursor-pointer text-sm font-medium text-foreground select-none"
        >
          {label}
        </span>
      )}
    </div>
  );
}
