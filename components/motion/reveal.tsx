"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in seconds. */
  delay?: number;
  as?: "div" | "section" | "li" | "span";
};

/**
 * Fades and lifts its children in once, on page load — not on scroll, so
 * nothing pops in as you move down the page. Honors prefers-reduced-motion by
 * rendering the content in its final state.
 */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const reduceMotion = useReducedMotion();
  const MotionTag = motion[as];

  const variants: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <MotionTag
      className={cn(className)}
      initial="hidden"
      animate="visible"
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}
