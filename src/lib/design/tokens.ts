export const designTokens = {
  colors: {
    background: "#070A11",
    foreground: "#EAF0FF",
    foregroundStrong: "#FFFFFF",
    graphite: {
      950: "#05070D",
      900: "#080B11",
      850: "#0B1018",
      800: "#101722",
      700: "#182232",
      600: "#253247"
    },
    blue: {
      500: "#2F6BFF",
      400: "#3B82F6",
      300: "#60A5FA",
      200: "#9DB9FF"
    },
    violet: {
      500: "#8B5CF6",
      400: "#A78BFA"
    },
    cyan: {
      400: "#22D3EE",
      300: "#67E8F9"
    },
    semantic: {
      success: "#21D19F",
      warning: "#F8C14A",
      danger: "#FF5C7A",
      info: "#38BDF8"
    }
  },
  gradients: {
    brand: "linear-gradient(135deg, #22D3EE 0%, #2F6BFF 48%, #8B5CF6 100%)",
    brandSoft:
      "linear-gradient(145deg, rgba(47, 107, 255, 0.22) 0%, rgba(139, 92, 246, 0.16) 48%, rgba(8, 11, 17, 0.9) 100%)",
    active: "linear-gradient(135deg, rgba(47, 107, 255, 0.32) 0%, rgba(139, 92, 246, 0.22) 100%)",
    panel: "linear-gradient(180deg, rgba(16, 23, 34, 0.92) 0%, rgba(8, 11, 17, 0.86) 100%)",
    page:
      "radial-gradient(circle at 16% -8%, rgba(47, 107, 255, 0.24), transparent 30%), radial-gradient(circle at 78% 4%, rgba(139, 92, 246, 0.18), transparent 26%), linear-gradient(180deg, #070A11 0%, #0B1018 48%, #080B11 100%)"
  },
  spacing: {
    shell: "clamp(1rem, 2.5vw, 2rem)",
    section: "clamp(4rem, 9vw, 8rem)",
    panel: "clamp(1rem, 2vw, 1.5rem)"
  },
  radii: {
    xs: "0.375rem",
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.25rem",
    panel: "1.5rem"
  },
  shadows: {
    soft: "0 18px 44px rgba(0, 0, 0, 0.24)",
    strong: "0 32px 88px rgba(0, 0, 0, 0.42)",
    glow: "0 0 42px rgba(47, 107, 255, 0.24)",
    depth: "0 22px 58px rgba(0, 0, 0, 0.34), 0 0 0 1px rgba(255, 255, 255, 0.035)",
    aura: "0 0 28px rgba(34, 211, 238, 0.12), 0 0 60px rgba(47, 107, 255, 0.14)"
  },
  motion: {
    fast: "160ms",
    base: "220ms",
    slow: "420ms",
    cinematic: "720ms",
    ease: "cubic-bezier(0.22, 1, 0.36, 1)",
    soft: "cubic-bezier(0.16, 1, 0.3, 1)"
  },
  zIndex: {
    base: 0,
    raised: 10,
    sticky: 30,
    overlay: 50,
    modal: 80,
    toast: 100
  }
} as const;
