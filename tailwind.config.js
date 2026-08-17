/**
 * Arabtec Executive Briefing design reminder:
 * Editorial construction-site system — cool paper, carbon rules, signal-red action states,
 * logical RTL-safe layout, never a rounded-card SaaS dashboard.
 */
export default {
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F5F6",
        ink: "#141518",
        signal: "#E11D2E",
        caution: "#D48B1F",
        ready: "#238356",
      },
      fontFamily: {
        display: ["Space Grotesk", "Arial", "sans-serif"],
        body: ["IBM Plex Sans", "Arial", "sans-serif"],
        arabic: ["IBM Plex Sans Arabic", "Arial", "sans-serif"],
      },
      boxShadow: {
        paper: "0 14px 34px rgba(20, 21, 24, 0.07)",
      },
    },
  },
};
