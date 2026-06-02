/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    // We remove the container center/padding because React Native 
    // doesn't have web-style viewports. You will use SafeAreaView instead.
    extend: {
      fontFamily: {
        sans: ["NotoSans_400Regular"],
        sansBold: ["NotoSans_700Bold"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          light: "hsl(var(--success-light))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        status: {
          new: "hsl(var(--status-new))",
          assigned: "hsl(var(--status-assigned))",
          lost: "hsl(var(--status-lost))",
          disposed: "hsl(var(--status-disposed))",
          repair: "hsl(var(--status-repair))",
        },
      },
      borderRadius: {
        none: "0px",
        xs: "2px",
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "14px",
        "2xl": "18px",
        "3xl": "22px",
        "4xl": "26px",
        full: "9999px",
      },
    },
  },
  plugins: [],
}