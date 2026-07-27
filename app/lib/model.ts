export type PlatformId = "mobile" | "mobile-landscape" | "tablet" | "desktop";
export type LabSection = "project" | "colors" | "typography" | "scales" | "semantics" | "catalog" | "health" | "export";
export type ScaleGroupKey = "spacing" | "dimensions" | "radii" | "borders" | "shadows" | "opacity";

export type ScaleToken = { id: string; name: string; value: string };
export type ColorPalette = {
  id: string;
  name: string;
  base: string;
  anchorStep: number;
  range: number;
  scale: Record<string, string>;
  manualSteps: string[];
};
export type TypeLevel = { id: string; name: string; size: number; weight: number; lineHeight: number; tracking: number };
export type TypographyFoundation = {
  family: string;
  source: "system" | "google" | "custom";
  availableWeights: number[];
  styles: string[];
  base: { size: number; weight: number; lineHeight: number; tracking: number };
  ratioName: string;
  ratio: number;
  levels: TypeLevel[];
};
export type SemanticToken = {
  id: string;
  name: string;
  category: string;
  defaultRef: string;
  themeRefs: Record<string, string>;
  platformRefs: Partial<Record<PlatformId, string>>;
  description: string;
};
export type ComponentToken = {
  id: string;
  name: string;
  component: string;
  reference: string;
  platformRefs: Partial<Record<PlatformId, string>>;
  description: string;
};
export type Theme = { id: string; name: string };
export type LayoutValues = { columns: number; margin: number; gutter: number; maxWidth: number; breakpoint: number; baseline: number; baselineEnabled: boolean };
export type ResponsiveScaleValues = { typography: number; spacing: number; dimensions: number };
export type PlatformConfig = {
  id: PlatformId;
  name: string;
  enabled: boolean;
  inheritFrom: PlatformId | null;
  overrides: Partial<LayoutValues>;
  scaleOverrides: Partial<ResponsiveScaleValues>;
  proposalPending: boolean;
};

export type DesignSystemProject = {
  schemaVersion: 2;
  id: string;
  meta: { name: string; description: string; brandMark: string; updatedAt: string };
  foundations: {
    colors: ColorPalette[];
    typography: TypographyFoundation;
    scales: Record<ScaleGroupKey, ScaleToken[]>;
    layoutBase: LayoutValues;
    customFoundations: { id: string; name: string; description: string; tokens: ScaleToken[] }[];
  };
  semanticTokens: SemanticToken[];
  componentTokens: ComponentToken[];
  themes: Theme[];
  platforms: Record<PlatformId, PlatformConfig>;
  implementationProfile: { web: boolean; ios: boolean; android: boolean };
};

export const uid = () => Math.random().toString(36).slice(2, 9);
export const colorSteps = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
export const platformOrder: PlatformId[] = ["mobile", "mobile-landscape", "tablet", "desktop"];
export const scaleLabels: Record<ScaleGroupKey, string> = {
  spacing: "Espaciado", dimensions: "Dimensiones", radii: "Radios", borders: "Bordes", shadows: "Sombras", opacity: "Opacidad",
};

const tokenList = (pairs: [string, string][]): ScaleToken[] => pairs.map(([name, value]) => ({ id: uid(), name, value }));

function mixHex(hex: string, target: number, ratio: number) {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return hex;
  const channels = [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16));
  return `#${channels.map((channel) => Math.round(channel + (target - channel) * ratio).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function relativeLuminance(hex: string) {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return 0;
  const channels = [0, 2, 4].map((index) => {
    const value = parseInt(clean.slice(index, index + 2), 16) / 255;
    return value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  });
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
}

export function contrastRatio(a: string, b: string) {
  const [high, low] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (high + .05) / (low + .05);
}

export function suggestedAnchor(hex: string) {
  const lightness = relativeLuminance(hex);
  if (lightness > .72) return 300;
  if (lightness > .48) return 400;
  if (lightness > .22) return 500;
  if (lightness > .09) return 600;
  return 700;
}

export function generateColorScale(base: string, anchorStep = suggestedAnchor(base), range = .78, manual: Record<string, string> = {}) {
  const anchorIndex = Math.max(0, colorSteps.indexOf(String(anchorStep)));
  return Object.fromEntries(colorSteps.map((step, index) => {
    if (manual[step]) return [step, manual[step]];
    if (index === anchorIndex) return [step, base.toUpperCase()];
    if (index < anchorIndex) {
      const distance = (anchorIndex - index) / Math.max(anchorIndex + .5, 1);
      return [step, mixHex(base, 255, Math.min(.96, distance * range + .08))];
    }
    const distance = (index - anchorIndex) / Math.max(colorSteps.length - anchorIndex, 1);
    return [step, mixHex(base, 0, Math.min(.82, distance * range + .02))];
  }));
}

export function makePalette(name: string, base: string): ColorPalette {
  const anchorStep = suggestedAnchor(base);
  return { id: uid(), name, base: base.toUpperCase(), anchorStep, range: .78, scale: generateColorScale(base, anchorStep, .78), manualSteps: [] };
}

export const fontOptions = [
  { family: "Inter", source: "google" as const, weights: [400, 500, 600, 700], styles: ["Normal", "Italic"] },
  { family: "Roboto", source: "google" as const, weights: [300, 400, 500, 700], styles: ["Normal", "Italic"] },
  { family: "Open Sans", source: "google" as const, weights: [400, 500, 600, 700], styles: ["Normal", "Italic"] },
  { family: "DM Sans", source: "google" as const, weights: [400, 500, 600, 700], styles: ["Normal", "Italic"] },
  { family: "Manrope", source: "google" as const, weights: [400, 500, 600, 700], styles: ["Normal"] },
  { family: "Montserrat", source: "google" as const, weights: [400, 500, 600, 700], styles: ["Normal", "Italic"] },
  { family: "Source Sans 3", source: "google" as const, weights: [400, 500, 600, 700], styles: ["Normal", "Italic"] },
  { family: "IBM Plex Sans", source: "google" as const, weights: [400, 500, 600, 700], styles: ["Normal", "Italic"] },
  { family: "Space Grotesk", source: "google" as const, weights: [400, 500, 600, 700], styles: ["Normal"] },
  { family: "Merriweather", source: "google" as const, weights: [400, 700], styles: ["Normal", "Italic"] },
  { family: "Georgia", source: "system" as const, weights: [400, 700], styles: ["Normal", "Italic"] },
  { family: "Arial", source: "system" as const, weights: [400, 700], styles: ["Normal", "Italic"] },
  { family: "SF Pro", source: "system" as const, weights: [400, 500, 600, 700], styles: ["Normal"] },
];

export const ratioOptions = [
  { name: "Suave", value: 1.125 }, { name: "Media", value: 1.2 }, { name: "Tercio mayor", value: 1.25 },
  { name: "Cuarta perfecta", value: 1.333 }, { name: "Amplia", value: 1.5 }, { name: "Proporción áurea", value: 1.618 },
];

export function generateTypeLevels(baseSize: number, ratio: number): TypeLevel[] {
  const specs: [string, number, number][] = [["Caption", -1, 500], ["Body", 0, 400], ["Label", 0, 600], ["Heading", 2, 650], ["Display", 4, 700]];
  return specs.map(([name, exponent, weight]) => {
    const size = Math.round(baseSize * ratio ** exponent * 10) / 10;
    return { id: uid(), name, size, weight, lineHeight: size >= 32 ? 1.08 : size >= 22 ? 1.2 : 1.5, tracking: size >= 28 ? -.02 : 0 };
  });
}

const defaultTypography = (): TypographyFoundation => ({
  family: "Inter", source: "google", availableWeights: [400, 500, 600, 700], styles: ["Normal", "Italic"],
  base: { size: 16, weight: 400, lineHeight: 1.5, tracking: 0 }, ratioName: "Tercio mayor", ratio: 1.25,
  levels: generateTypeLevels(16, 1.25),
});

export const requiredSemanticIds = [
  "surface-default", "surface-raised", "surface-overlay", "text-primary", "text-muted", "text-on-action",
  "border-subtle", "border-strong", "action-primary", "action-hover", "action-pressed", "focus-ring",
  "feedback-success", "feedback-warning", "feedback-destructive", "disabled-surface", "disabled-content",
  "selected-surface", "selected-border",
];

const semantic = (id: string, name: string, category: string, defaultRef: string, description: string, darkRef?: string): SemanticToken => ({
  id, name, category, defaultRef, description, themeRefs: darkRef ? { dark: darkRef } : {}, platformRefs: {},
});

export const defaultComponentTokens = (): ComponentToken[] => [
  { id: "button-primary-bg", name: "button.primary.background", component: "Button", reference: "semantic:action-primary", platformRefs: {}, description: "Fondo estable del botón primario" },
  { id: "button-primary-hover", name: "button.primary.hover", component: "Button", reference: "semantic:action-hover", platformRefs: {}, description: "Estado hover en web" },
  { id: "button-primary-pressed", name: "button.primary.pressed", component: "Button", reference: "semantic:action-pressed", platformRefs: {}, description: "Estado presionado" },
  { id: "button-destructive-bg", name: "button.destructive.background", component: "Button", reference: "semantic:feedback-destructive", platformRefs: {}, description: "Acción de consecuencia destructiva" },
  { id: "input-border", name: "input.default.border", component: "Input", reference: "semantic:border-subtle", platformRefs: {}, description: "Borde por defecto" },
  { id: "input-focus-border", name: "input.focus.border", component: "Input", reference: "semantic:focus-ring", platformRefs: {}, description: "Borde y anillo de foco" },
  { id: "input-error-border", name: "input.error.border", component: "Input", reference: "semantic:feedback-destructive", platformRefs: {}, description: "Borde de validación fallida" },
  { id: "control-selected-bg", name: "control.selected.background", component: "Selection controls", reference: "semantic:selected-surface", platformRefs: {}, description: "Checkbox, radio y switch seleccionados" },
  { id: "card-radius", name: "card.container.radius", component: "Card", reference: "primitive:radii.md", platformRefs: {}, description: "Decisión específica y estable del contenedor" },
];

const baseLayout: LayoutValues = { columns: 4, margin: 16, gutter: 16, maxWidth: 480, breakpoint: 0, baseline: 8, baselineEnabled: true };
const platforms = (): Record<PlatformId, PlatformConfig> => ({
  mobile: { id: "mobile", name: "Mobile", enabled: true, inheritFrom: null, overrides: {}, scaleOverrides: {}, proposalPending: false },
  "mobile-landscape": { id: "mobile-landscape", name: "Mobile horizontal", enabled: false, inheritFrom: "mobile", overrides: { columns: 6, margin: 24, maxWidth: 760, breakpoint: 568 }, scaleOverrides: { typography: 1, spacing: 1, dimensions: 1 }, proposalPending: true },
  tablet: { id: "tablet", name: "Tablet", enabled: false, inheritFrom: "mobile", overrides: { columns: 8, margin: 32, gutter: 24, maxWidth: 1024, breakpoint: 768 }, scaleOverrides: { typography: 1.05, spacing: 1.1, dimensions: 1 }, proposalPending: true },
  desktop: { id: "desktop", name: "Desktop", enabled: false, inheritFrom: "mobile", overrides: { columns: 12, margin: 48, gutter: 24, maxWidth: 1280, breakpoint: 1200 }, scaleOverrides: { typography: 1.125, spacing: 1.2, dimensions: 1 }, proposalPending: true },
});

export function createInitialProject(): DesignSystemProject {
  const colors = [makePalette("Indigo", "#5B5CE2"), makePalette("Amber", "#F5A524"), makePalette("Slate", "#64748B"), makePalette("Rose", "#E5484D")];
  return {
    schemaVersion: 2,
    id: "ds-nova",
    meta: { name: "Nova Design System", description: "Una base clara, expresiva y accesible para productos digitales.", brandMark: "N", updatedAt: new Date().toISOString() },
    foundations: {
      colors,
      typography: defaultTypography(),
      scales: {
        spacing: tokenList([["2xs", "4px"], ["xs", "8px"], ["sm", "12px"], ["md", "16px"], ["lg", "24px"], ["xl", "32px"], ["2xl", "48px"], ["3xl", "64px"]]),
        dimensions: tokenList([["control-sm", "32px"], ["control-md", "40px"], ["control-lg", "48px"]]),
        radii: tokenList([["sm", "6px"], ["md", "10px"], ["lg", "16px"], ["pill", "999px"]]),
        borders: tokenList([["subtle", "1px"], ["strong", "2px"]]),
        shadows: tokenList([["sm", "0 1px 3px rgba(24,24,27,.10)"], ["md", "0 8px 24px rgba(24,24,27,.14)"], ["lg", "0 20px 50px rgba(24,24,27,.18)"]]),
        opacity: tokenList([["disabled-interaction", "0.42"], ["temporary-overlay", "0.68"], ["solid", "1"]]),
      },
      layoutBase: baseLayout,
      customFoundations: [],
    },
    semanticTokens: [
      semantic("surface-default", "surface.default", "Superficie", "Slate.50", "Lienzo principal", "Slate.900"),
      semantic("surface-raised", "surface.raised", "Superficie", "#FFFFFF", "Contenedores elevados", "Slate.800"),
      semantic("surface-overlay", "surface.overlay", "Superficie", "Slate.900@72", "Overlays con alpha incorporado", "Slate.900@76"),
      semantic("text-primary", "text.primary", "Texto", "Slate.900", "Texto de mayor jerarquía", "Slate.50"),
      semantic("text-muted", "text.muted", "Texto", "Slate.600", "Texto secundario", "Slate.300"),
      semantic("text-on-action", "text.on-action", "Texto", "#FFFFFF", "Contenido sobre acciones", "#FFFFFF"),
      semantic("border-subtle", "border.subtle", "Borde", "Slate.200", "Separación suave", "Slate.700"),
      semantic("border-strong", "border.strong", "Borde", "Slate.400", "Separación enfática", "Slate.500"),
      semantic("action-primary", "action.primary", "Acción", "Indigo.500", "Acción principal", "Indigo.400"),
      semantic("action-hover", "action.hover", "Acción", "Indigo.600", "Hover de acción", "Indigo.300"),
      semantic("action-pressed", "action.pressed", "Acción", "Indigo.700", "Acción presionada", "Indigo.200"),
      semantic("focus-ring", "focus.ring", "Foco", "Indigo.400@42", "Indicador de foco", "Indigo.300@52"),
      semantic("feedback-success", "feedback.success", "Feedback", "Indigo.600", "Confirmación positiva", "Indigo.300"),
      semantic("feedback-warning", "feedback.warning", "Feedback", "Amber.600", "Advertencia", "Amber.400"),
      semantic("feedback-destructive", "feedback.destructive", "Feedback", "Rose.600", "Error o acción destructiva", "Rose.400"),
      semantic("disabled-surface", "disabled.surface", "Estado", "Slate.200@68", "Superficie deshabilitada", "Slate.700@68"),
      semantic("disabled-content", "disabled.content", "Estado", "Slate.500", "Contenido deshabilitado", "Slate.500"),
      semantic("selected-surface", "selected.surface", "Estado", "Indigo.500", "Control seleccionado", "Indigo.400"),
      semantic("selected-border", "selected.border", "Estado", "Indigo.600", "Borde seleccionado", "Indigo.300"),
    ],
    componentTokens: defaultComponentTokens(),
    themes: [{ id: "light", name: "Claro" }, { id: "dark", name: "Oscuro" }],
    platforms: platforms(),
    implementationProfile: { web: true, ios: true, android: true },
  };
}

function parseAlphaReference(reference: string) {
  const [base, alpha] = reference.split("@");
  return { base, alpha: alpha ? Math.max(0, Math.min(100, Number(alpha))) / 100 : 1 };
}

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean) || alpha >= 1) return hex;
  return `#${clean}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`.toUpperCase();
}

export function resolvePrimitiveColor(project: DesignSystemProject, reference: string) {
  const { base, alpha } = parseAlphaReference(reference);
  if (base.startsWith("#")) return withAlpha(base, alpha);
  const [paletteName, step] = base.split(".");
  const color = project.foundations.colors.find((item) => item.name === paletteName)?.scale[step];
  return color ? withAlpha(color, alpha) : "";
}

export function semanticById(project: DesignSystemProject, id: string) {
  return project.semanticTokens.find((token) => token.id === id || token.name === id);
}

export function resolveSemantic(project: DesignSystemProject, id: string, themeId: string, platform: PlatformId) {
  const token = semanticById(project, id);
  if (!token) return "";
  const reference = token.platformRefs[platform] || token.themeRefs[themeId] || token.defaultRef;
  return resolvePrimitiveColor(project, reference);
}

export function resolveScaleToken(project: DesignSystemProject, reference: string) {
  const [group, name] = reference.replace("primitive:", "").split(".") as [ScaleGroupKey, string];
  return project.foundations.scales[group]?.find((token) => token.name === name)?.value || "";
}

export function resolveComponent(project: DesignSystemProject, id: string, themeId: string, platform: PlatformId) {
  const token = project.componentTokens.find((item) => item.id === id || item.name === id);
  if (!token) return "";
  const reference = token.platformRefs[platform] || token.reference;
  if (reference.startsWith("semantic:")) return resolveSemantic(project, reference.slice(9), themeId, platform);
  if (reference.startsWith("primitive:")) return resolveScaleToken(project, reference);
  return "";
}

export function allColorReferences(project: DesignSystemProject) {
  return ["#FFFFFF", "#000000", ...project.foundations.colors.flatMap((item) => colorSteps.map((step) => `${item.name}.${step}`))];
}

export function resolveLayout(project: DesignSystemProject, platformId: PlatformId): LayoutValues {
  const platform = project.platforms[platformId];
  if (!platform || !platform.inheritFrom) return { ...project.foundations.layoutBase, ...platform?.overrides };
  return { ...resolveLayout(project, platform.inheritFrom), ...platform.overrides };
}

export function resolveResponsiveScale(project: DesignSystemProject, platformId: PlatformId): ResponsiveScaleValues {
  const platform = project.platforms[platformId];
  const base = platform?.inheritFrom ? resolveResponsiveScale(project, platform.inheritFrom) : { typography: 1, spacing: 1, dimensions: 1 };
  return { ...base, ...platform?.scaleOverrides };
}

type LegacyProject = {
  schemaVersion?: number;
  id?: string;
  meta?: { name?: string; description?: string; target?: string; cover?: string; updatedAt?: string };
  foundations?: {
    colors?: { id?: string; name?: string; base?: string; scale?: Record<string, string> }[];
    typography?: { name?: string; family?: string; size?: string; weight?: string; lineHeight?: string }[];
    spacing?: ScaleToken[]; dimensions?: ScaleToken[]; radii?: ScaleToken[]; borders?: ScaleToken[]; shadows?: ScaleToken[]; opacity?: ScaleToken[];
    customGroups?: { id: string; name: string; tokens: ScaleToken[] }[];
  };
  semanticTokens?: { id: string; name: string; category: string; defaultRef: string }[];
  themes?: { id: string; name: string; values?: Record<string, string> }[];
};

export function migrateProject(input: unknown): DesignSystemProject {
  const fallback = createInitialProject();
  if (!input || typeof input !== "object") return fallback;
  const candidate = input as Partial<DesignSystemProject>;
  if (candidate.schemaVersion === 2 && candidate.meta && candidate.foundations && candidate.semanticTokens && candidate.componentTokens) {
    return {
      ...fallback, ...candidate, schemaVersion: 2,
      meta: { ...fallback.meta, ...candidate.meta },
      foundations: { ...fallback.foundations, ...candidate.foundations },
      platforms: Object.fromEntries(platformOrder.map((id) => [id, { ...fallback.platforms[id], ...candidate.platforms?.[id], scaleOverrides: { ...fallback.platforms[id].scaleOverrides, ...candidate.platforms?.[id]?.scaleOverrides } }])) as Record<PlatformId, PlatformConfig>,
      implementationProfile: { ...fallback.implementationProfile, ...candidate.implementationProfile },
    } as DesignSystemProject;
  }

  const legacy = input as LegacyProject;
  const colors = legacy.foundations?.colors?.map((item) => {
    const base = item.base || "#5B5CE2";
    const anchorStep = suggestedAnchor(base);
    return { id: item.id || uid(), name: item.name || "Paleta", base, anchorStep, range: .78, scale: item.scale || generateColorScale(base, anchorStep, .78), manualSteps: [] };
  }) || fallback.foundations.colors;
  const legacyType = legacy.foundations?.typography?.find((item) => item.name === "Body") || legacy.foundations?.typography?.[0];
  const family = legacyType?.family || fallback.foundations.typography.family;
  const baseSize = Number.parseFloat(legacyType?.size || "16") || 16;
  const themes = legacy.themes?.map((theme) => ({ id: theme.id, name: theme.name })) || fallback.themes;
  const semanticTokens = legacy.semanticTokens?.map((token) => ({
    ...token,
    description: "Migrado desde el proyecto anterior",
    themeRefs: Object.fromEntries((legacy.themes || []).flatMap((theme) => theme.values?.[token.id] ? [[theme.id, theme.values[token.id]]] : [])),
    platformRefs: {},
  })) || fallback.semanticTokens;
  const target = legacy.meta?.target || "both";
  return {
    ...fallback,
    id: legacy.id || fallback.id,
    meta: { name: legacy.meta?.name || fallback.meta.name, description: legacy.meta?.description || fallback.meta.description, brandMark: (legacy.meta?.name || "N").slice(0, 1).toUpperCase(), updatedAt: legacy.meta?.updatedAt || new Date().toISOString() },
    foundations: {
      ...fallback.foundations,
      colors,
      typography: { ...defaultTypography(), family, source: fontOptions.find((font) => font.family === family)?.source || "custom", base: { ...fallback.foundations.typography.base, size: baseSize }, levels: generateTypeLevels(baseSize, 1.25) },
      scales: {
        spacing: legacy.foundations?.spacing || fallback.foundations.scales.spacing,
        dimensions: legacy.foundations?.dimensions || fallback.foundations.scales.dimensions,
        radii: legacy.foundations?.radii || fallback.foundations.scales.radii,
        borders: legacy.foundations?.borders || fallback.foundations.scales.borders,
        shadows: legacy.foundations?.shadows || fallback.foundations.scales.shadows,
        opacity: legacy.foundations?.opacity || fallback.foundations.scales.opacity,
      },
      customFoundations: legacy.foundations?.customGroups?.map((group) => ({ ...group, description: "Migrado desde Grupos libres" })) || [],
    },
    semanticTokens,
    componentTokens: defaultComponentTokens(),
    themes,
    platforms: platforms(),
    implementationProfile: { web: target !== "mobile", ios: target !== "web", android: target !== "web" },
  };
}

