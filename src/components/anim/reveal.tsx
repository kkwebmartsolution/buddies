import { type ReactNode } from "react";
import { motion, type Variants } from "motion/react";

const easeOut = [0.16, 1, 0.3, 1] as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
};

/** Fade + rise reveal triggered when the element scrolls into view. */
export function Reveal({ children, className, delay = 0, y = 28, once = true }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.8, ease: easeOut, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Scale-in reveal for imagery / cards. */
export function ScaleReveal({ children, className, delay = 0, once = true }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration: 0.9, ease: easeOut, delay }}
    >
      {children}
    </motion.div>
  );
}

const wordContainer: Variants = {
  hidden: {},
  visible: (stagger: number) => ({ transition: { staggerChildren: stagger } }),
};

const wordChild: Variants = {
  hidden: { y: "110%", opacity: 0 },
  visible: { y: "0%", opacity: 1, transition: { duration: 0.8, ease: easeOut } },
};

/** Word-by-word masked reveal for headlines. */
export function WordReveal({
  text = "",
  className,
  stagger = 0.08,
  once = true,
}: {
  text?: string;
  className?: string;
  stagger?: number;
  once?: boolean;
}) {
  const safeText = text || "";
  return (
    <motion.span
      className={className}
      variants={wordContainer}
      custom={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-40px" }}
      aria-label={safeText}
    >
      {safeText.split(" ").map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" aria-hidden="true">
          <motion.span className="inline-block" variants={wordChild}>
            {word}
            {i < safeText.split(" ").length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}