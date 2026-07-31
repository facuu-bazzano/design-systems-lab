import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: process.cwd(),
  base: process.env.STORYBOOK_BASE_PATH || "/",
  plugins: [react()],
});
