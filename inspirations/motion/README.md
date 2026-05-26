# Motion

## Inspiration Links

- Motion.dev transitions: https://motion.dev/motion/transition
- Motion.dev React animation: https://motion.dev/docs/react-animation
- Motion.dev in-view animation: https://motion.dev/docs/inview
- Anime.js stagger utilities: https://animejs.com/documentation/utilities/stagger/
- GSAP quickSetter performance pattern: https://gsap.com/docs/v3/GSAP/gsap.quickSetter/
- Framer reduced motion: https://www.framer.com/help/articles/reduced-motion-settings/

## Notes

- Motion should feel subtle, premium, and purposeful.
- Prefer opacity, transform, shadow, and glow transitions.

## Implementation Ideas

- Use shared CSS classes and motion constants for fades, stagger, shimmer, glow, hover, magnetic, and floating effects.
- Respect `prefers-reduced-motion`.

## Performance Considerations

- Animate compositor-friendly properties.
- Avoid particle systems and heavy canvas scenes in core product UI.

## Adaptation Ideas For MatchIQ

- Use restrained reveal pacing for intelligence panels and soft glow transitions for AI states.
