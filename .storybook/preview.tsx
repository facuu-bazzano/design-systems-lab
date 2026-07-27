import type { Preview } from "@storybook/react-vite";
import "../app/globals.css";

const preview: Preview = {
  globalTypes: {
    labTheme: { description: "Tema interno", defaultValue: "light", toolbar: { icon: "mirror", items: [{ value: "light", title: "Claro" }, { value: "dark", title: "Oscuro" }] } },
  },
  decorators: [(Story, context) => <div className={`storybook-frame theme-${context.globals.labTheme}`} data-lab-theme={context.globals.labTheme}><Story /></div>],
  parameters: { layout: "padded", a11y: { test: "error" }, controls: { expanded: true } },
};
export default preview;
