import { ColorPalette, generateColorScale, uid } from "./model";

export type ColorPreset = {
  id: string;
  system: string;
  name: string;
  description: string;
  fidelity: "Paleta publicada" | "Referencia generada";
  sourceUrl: string;
  base: string;
  anchorStep: number;
  scale?: Record<string, string>;
};

export const colorPresets: ColorPreset[] = [
  {
    id: "shadcn-zinc",
    system: "shadcn/ui",
    name: "Zinc",
    description: "Neutral de Tailwind utilizado habitualmente por shadcn/ui.",
    fidelity: "Paleta publicada",
    sourceUrl: "https://ui.shadcn.com/colors",
    base: "#71717A",
    anchorStep: 500,
    scale: { "50": "#FAFAFA", "100": "#F4F4F5", "200": "#E4E4E7", "300": "#D4D4D8", "400": "#A1A1AA", "500": "#71717A", "600": "#52525B", "700": "#3F3F46", "800": "#27272A", "900": "#18181B", "950": "#09090B" },
  },
  {
    id: "ant-blue",
    system: "Ant Design",
    name: "Daybreak Blue",
    description: "Escala oficial de @ant-design/colors con blue-6 como color principal.",
    fidelity: "Paleta publicada",
    sourceUrl: "https://ant.design/docs/spec/colors/",
    base: "#1677FF",
    anchorStep: 600,
    scale: { "100": "#E6F4FF", "200": "#BAE0FF", "300": "#91CAFF", "400": "#69B1FF", "500": "#4096FF", "600": "#1677FF", "700": "#0958D9", "800": "#003EB3", "900": "#002C8C", "1000": "#001D66" },
  },
  {
    id: "base-blue",
    system: "Uber · Base Web",
    name: "Base Blue",
    description: "Rampa editable generada desde el azul de referencia de Base Web.",
    fidelity: "Referencia generada",
    sourceUrl: "https://baseweb.design/guides/colors/",
    base: "#276EF1",
    anchorStep: 500,
  },
  {
    id: "spotify-green",
    system: "Spotify",
    name: "Spotify Green",
    description: "Rampa editable generada desde el verde de marca; no representa tokens oficiales internos.",
    fidelity: "Referencia generada",
    sourceUrl: "https://developer.spotify.com/documentation/design",
    base: "#1ED760",
    anchorStep: 500,
  },
  {
    id: "apple-blue",
    system: "Apple HIG",
    name: "System Blue",
    description: "Referencia editable. Los colores de sistema reales son dinámicos según apariencia y accesibilidad.",
    fidelity: "Referencia generada",
    sourceUrl: "https://developer.apple.com/design/human-interface-guidelines/color",
    base: "#007AFF",
    anchorStep: 500,
  },
];

export function paletteFromPreset(preset: ColorPreset): ColorPalette {
  const scale = preset.scale || generateColorScale(preset.base, preset.anchorStep, .78);
  return {
    id: uid(),
    name: `${preset.system} · ${preset.name}`,
    base: preset.base,
    anchorStep: preset.anchorStep,
    range: .78,
    scale,
    manualSteps: preset.scale ? Object.keys(scale) : [],
    origin: preset.system,
    sourceUrl: preset.sourceUrl,
    creationMethod: "preset",
  };
}
