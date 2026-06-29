"use client";

import React from "react";
import { cn } from "@/lib/utils";

type GlassButtonSize = "sm" | "default" | "lg" | "icon";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: GlassButtonSize;
  wrapClassName?: string;
}

const SIZES: Record<GlassButtonSize, { wrap: string; text: string }> = {
  sm:      { wrap: "rounded-lg  w-auto h-8",  text: "px-3 py-1.5 text-xs gap-1.5" },
  default: { wrap: "rounded-xl  w-auto h-10", text: "px-4 py-2.5 text-sm gap-2" },
  lg:      { wrap: "rounded-xl  w-auto h-12", text: "px-6 py-3   text-base gap-2" },
  icon:    { wrap: "rounded-full w-9   h-9",  text: "w-full h-full" },
};

export function GlassButton({
  children,
  size = "default",
  wrapClassName,
  className,
  ...props
}: GlassButtonProps) {
  const s = SIZES[size];
  return (
    <div className={cn("glass-button-wrap", s.wrap, wrapClassName)}>
      <button className={cn("glass-button", className)} {...props}>
        <span className={cn("glass-button-text", s.text)}>{children}</span>
      </button>
      <div className="glass-button-shadow" />
    </div>
  );
}
