import type { Variants } from "framer-motion";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const staggerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

export const cardHover: Variants = {
  rest: {
    scale: 1,
    rotateX: 0,
    rotateY: 0,
    boxShadow: "0 0 0px rgba(204,0,0,0)",
  },
  hover: {
    scale: 1.03,
    boxShadow: "0 0 30px rgba(204,0,0,0.4), 0 20px 40px rgba(0,0,0,0.5)",
    transition: { duration: 0.3 },
  },
  tap: { scale: 0.98 },
};

export const buttonHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    boxShadow: "0 0 20px rgba(204,0,0,0.6), 0 0 40px rgba(204,0,0,0.3)",
    transition: { duration: 0.2 },
  },
  tap: { scale: 0.95 },
};

export const glitchVariants: Variants = {
  normal: { x: 0, opacity: 1 },
  glitch: {
    x: [-4, 4, -2, 2, 0],
    opacity: [1, 0.8, 1, 0.9, 1],
    transition: {
      duration: 0.3,
      repeat: Infinity,
      repeatDelay: 4,
    },
  },
};

export const cursorBlink: Variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
};

export const neonFlicker: Variants = {
  normal: {
    textShadow: "0 0 10px #FF0000, 0 0 20px #CC0000",
  },
  flicker: {
    textShadow: [
      "0 0 10px #FF0000, 0 0 20px #CC0000",
      "0 0 5px #FF0000",
      "0 0 10px #FF0000, 0 0 40px #CC0000",
      "0 0 3px #FF0000",
      "0 0 10px #FF0000, 0 0 20px #CC0000",
    ],
    transition: {
      duration: 0.3,
      repeat: Infinity,
      repeatDelay: 5,
    },
  },
};

export const floatAnimation = {
  animate: {
    y: [0, -20, 0],
    rotateY: [0, 5, 0],
  },
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: [0.42, 0, 0.58, 1] as const,
  },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 },
  },
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35 },
  }),
};
