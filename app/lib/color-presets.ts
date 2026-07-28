import generatedLibraries from "./color-library.generated.json";
import { ColorPalette, uid } from "./model";

export type ColorPreset = {
  id: string;
  libraryId: string;
  system: string;
  name: string;
  description: string;
  sourceUrl: string;
  base: string;
  anchorStep: number;
  scale: Record<string, string>;
};

export type ColorLibrary = {
  id: string;
  name: string;
  description: string;
  sourceUrl: string;
  presets: ColorPreset[];
};

function anchorFor(scale: Record<string, string>) {
  const steps = Object.keys(scale).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (steps.includes(500)) return 500;
  if (steps.includes(600)) return 600;
  if (steps.includes(9)) return 9;
  return steps[Math.floor(steps.length / 2)] || 500;
}

const libraryData = generatedLibraries as unknown as Array<{ id: string; name: string; description: string; sourceUrl: string; palettes: Array<{ id: string; name: string; description: string; scale: Record<string, string> }> }>;

export const colorLibraries: ColorLibrary[] = libraryData.map((library) => ({
  id: library.id,
  name: library.name,
  description: library.description,
  sourceUrl: library.sourceUrl,
  presets: library.palettes.map((preset) => {
    const anchorStep = anchorFor(preset.scale);
    return {
      id: preset.id,
      libraryId: library.id,
      system: library.name,
      name: preset.name,
      description: preset.description,
      sourceUrl: library.sourceUrl,
      scale: preset.scale,
      anchorStep,
      base: preset.scale[String(anchorStep)] || Object.values(preset.scale)[0],
    };
  }),
}));

export const colorPresets = colorLibraries.flatMap((library) => library.presets);

export function paletteFromPreset(preset: ColorPreset): ColorPalette {
  return {
    id: uid(),
    name: `${preset.system} · ${preset.name}`,
    base: preset.base,
    anchorStep: preset.anchorStep,
    range: .78,
    scale: { ...preset.scale },
    manualSteps: Object.keys(preset.scale),
    origin: preset.system,
    sourceUrl: preset.sourceUrl,
    creationMethod: "preset",
  };
}
