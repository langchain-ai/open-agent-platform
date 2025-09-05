/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    "./agent/**/*.{ts,tsx,js,jsx}",
    "../../packages/deep-agent-chat/src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      components: {
        ".word-added": {
          backgroundColor: "rgba(46, 160, 67, 0.4)",
          color: "#ffffff",
          padding: "2px 4px",
          borderRadius: "3px",
          fontWeight: "600",
        },
        ".word-removed": {
          backgroundColor: "rgba(248, 81, 73, 0.4)",
          color: "#ffffff",
          padding: "2px 4px",
          borderRadius: "3px",
          fontWeight: "600",
          textDecoration: "line-through",
          textDecorationColor: "#f85149",
        },
      },
      colors: {
        background: "#ffffff",
        foreground: "#252525",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#252525",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#252525",
        },
        success: {
          DEFAULT: "#22c55e",
          dark: "#16a34a",
        },
        warning: {
          DEFAULT: "#f59e0b",
          dark: "#d97706",
        },
        primary: {
          DEFAULT: "#343434",
          foreground: "#fafafa",
        },
        secondary: {
          DEFAULT: "#f7f7f7",
          foreground: "#343434",
        },
        muted: {
          DEFAULT: "#f7f7f7",
          foreground: "#8e8e8e",
        },
        accent: {
          DEFAULT: "#f7f7f7",
          foreground: "#343434",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        "user-message": "#6366f1",
        "avatar-bg": "#f3f0ff",
        "subagent-hover": "#e0e7ff",
        "border-light": "#f3f3f3",
        surface: "#fafafa",
        border: "#ebebeb",
        input: "#ebebeb",
        ring: "#d9d9d9",
        tertiary: "#8e8e8e",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("tailwind-scrollbar")],
};
