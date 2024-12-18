import { nextui } from "@nextui-org/theme";
import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: [
    "./src/**/*.tsx",
    "./node_modules/@nextui-org/theme/dist/components/toggle.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
      blur: {
        xs: "0.5px",
      },
    },
  },
  plugins: [nextui()],
} satisfies Config;
