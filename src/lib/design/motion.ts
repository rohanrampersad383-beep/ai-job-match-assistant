export const motionTimings = {
  fast: 0.16,
  base: 0.22,
  slow: 0.42,
  stagger: 0.055
} as const;

export const motionEasings = {
  out: [0.22, 1, 0.36, 1],
  soft: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1]
} as const;

export const cssMotion = {
  fadeIn: "motion-fade-in",
  revealUp: "motion-reveal-up",
  stagger: "motion-stagger",
  hoverLift: "motion-hover-lift",
  glowHover: "motion-glow-hover",
  float: "motion-float",
  shimmer: "motion-shimmer"
} as const;

export function getStaggerDelay(index: number, step = 55) {
  return `${Math.max(index, 0) * step}ms`;
}
