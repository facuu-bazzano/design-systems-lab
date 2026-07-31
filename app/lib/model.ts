export type PlatformId = "mobile" | "mobile-landscape" | "tablet" | "desktop";
export type LabSection = "project" | "colors" | "typography" | "scales" | "semantics" | "catalog" | "scenarios" | "health" | "export";
export type ScaleGroupKey = "spacing" | "dimensions" | "radii" | "borders" | "shadows" | "opacity";
export type ProjectState = "validated" | "blank";
export type ScaleToken = { id: string; name: string; value: string };
export type ColorPalette = { id: string; name: string; base: string; anchorStep: number; range: number; scale: Record<string, string>; manualSteps: string[]; origin?: string; sourceUrl?: string; creationMethod?: "generated" | "manual" | "preset" };
export type FontSource = "system" | "google" | "custom";
export type TypographyFamily = { id: string; family: string; source: FontSource; availableWeights: number[]; styles: string[] };
export type TypeLevel = { id: string; name: string; familyId: string; size: number; weight: number; lineHeight: number; tracking: number };
export type TypographyFoundation = { families: TypographyFamily[]; primaryFamilyId: string; base: { size: number; weight: number; lineHeight: number; tracking: number }; ratioName: string; ratio: number; levels: TypeLevel[] };
export type SemanticToken = { id: string; name: string; category: string; defaultRef: string; themeRefs: Record<string, string>; platformRefs: Partial<Record<PlatformId, string>>; description: string; source?: "system" | "custom" };
export type TokenValueType = "color" | "dimension" | "number" | "fontFamily" | "fontWeight" | "shadow" | "opacity" | "duration" | "easing" | "string" | "boolean";
export type ProjectComponentDefinition = { id: string; key: string; name: string; description: string; source: "catalog" | "custom"; rendererKey?: string };
export type ComponentVariant = { id: string; key: string; componentId: string; name: string; description: string; inheritsFrom?: string; visibleInCatalog: boolean };
export type ComponentToken = { id: string; key: string; name: string; componentId: string; variantId: string; state: string; property: string; valueType: TokenValueType; reference: string; platformRefs: Partial<Record<PlatformId, string>>; description: string };
export type Theme = { id: string; name: string };
export type LayoutValues = { columns: number; margin: number; gutter: number; maxWidth: number; breakpoint: number; verticalRhythmUnit: number; verticalRhythmEnabled: boolean };
export type ResponsiveScaleValues = { typography: number; spacing: number; dimensions: number };
export type PlatformConfig = { id: PlatformId; name: string; enabled: boolean; inheritFrom: PlatformId | null; overrides: Partial<LayoutValues>; scaleOverrides: Partial<ResponsiveScaleValues>; proposalPending: boolean; includedWhileInactive?: boolean };

export type DesignSystemProject = {
  schemaVersion: 5;
  projectState: ProjectState;
  id: string;
  meta: { name: string; description: string; brandMark: string; updatedAt: string };
  foundations: { colors: ColorPalette[]; typography: TypographyFoundation; scales: Record<ScaleGroupKey, ScaleToken[]>; layoutBase: LayoutValues; customFoundations: { id: string; name: string; description: string; tokens: ScaleToken[] }[] };
  semanticTokens: SemanticToken[];
  components: ProjectComponentDefinition[];
  componentVariants: ComponentVariant[];
  componentTokens: ComponentToken[];
  themes: Theme[];
  platforms: Record<PlatformId, PlatformConfig>;
  implementationProfile: { web: boolean; ios: boolean; android: boolean };
};

export const uid = () => Math.random().toString(36).slice(2, 9);
export const colorSteps = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
export const platformOrder: PlatformId[] = ["mobile", "mobile-landscape", "tablet", "desktop"];
export const scaleLabels: Record<ScaleGroupKey, string> = { spacing: "Espaciado", dimensions: "Dimensiones", radii: "Radios", borders: "Bordes", shadows: "Sombras", opacity: "Opacidad" };
export const componentKey = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `component-${uid()}`;
export const tokenKey = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/(^[.-]+|[.-]+$)/g, "") || `token-${uid()}`;

const catalogComponentSeeds: Array<[string, string, string]> = [
  ["button", "Button", "Acciones"], ["link", "Link", "Acciones"], ["icon", "Icon", "Acciones"],
  ["input", "Text field", "Inputs"], ["textarea", "Text area", "Inputs"], ["select", "Select", "Inputs"], ["calendar", "Calendar", "Inputs"],
  ["checkbox", "Checkbox", "Selección"], ["radio", "Input radio", "Selección"], ["switch", "Switch", "Selección"],
  ["accordion", "Accordion", "Navegación"], ["breadcrumbs", "Breadcrumbs", "Navegación"], ["dropdown", "Dropdown", "Navegación"], ["pagination", "Pagination", "Navegación"], ["tabs", "Tabs", "Navegación"],
  ["alert", "Alert", "Feedback"], ["badge", "Badge", "Feedback"], ["loading", "Loading indicator", "Feedback"], ["progress", "Progress bar", "Feedback"], ["skeleton", "Skeleton", "Feedback"], ["toast", "Toast", "Feedback"], ["tooltip", "Tooltip", "Feedback"],
  ["avatar", "Avatar", "Datos y superficies"], ["card", "Card", "Datos y superficies"], ["carousel", "Carousel", "Datos y superficies"], ["divider", "Divider", "Datos y superficies"], ["image", "Image", "Datos y superficies"], ["list", "List", "Datos y superficies"], ["modal", "Modal", "Datos y superficies"], ["table", "Table", "Datos y superficies"],
];

export const defaultComponentDefinitions = (): ProjectComponentDefinition[] => [
  ...catalogComponentSeeds.map(([key, name, description]) => ({ id: `component-${key}`, key, name, description, source: "catalog" as const, rendererKey: key })),
  { id: "component-control", key: "control", name: "Controles compartidos", description: "Decisiones comunes de selección", source: "custom" },
];

const componentAlias: Record<string, string> = { "text field": "input", "text area": "textarea", "input radio": "radio", selection: "control", controls: "control" };
function componentIdForName(value: string) { const key = componentAlias[value.trim().toLowerCase()] || componentKey(value); return `component-${key}`; }
function titleCase(value: string) { return value.split(/[-_.\s]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function inferValueType(reference: string, property = ""): TokenValueType {
  if (reference.startsWith("primitive:radii") || reference.startsWith("primitive:borders") || /radius|width|height|gap|spacing|size/.test(property)) return "dimension";
  if (reference.startsWith("primitive:shadows") || property.includes("shadow")) return "shadow";
  if (reference.startsWith("primitive:opacity") || property.includes("opacity")) return "opacity";
  return "color";
}

export function componentById(project: DesignSystemProject, id: string) { return project.components.find((item) => item.id === id || item.key === id); }
export function variantById(project: DesignSystemProject, id: string) { return project.componentVariants.find((item) => item.id === id); }
const structuralVariantKeys = new Set(["default", "track", "thumb", "focus", "item", "radius", "container", "header", "row", "divider", "menu"]);
export function visibleRendererVariants(project: DesignSystemProject, component: ProjectComponentDefinition) {
  const variants = project.componentVariants.filter((variant) => variant.componentId === component.id && variant.visibleInCatalog);
  return variants.filter((variant) => component.rendererKey === "button" || !structuralVariantKeys.has(variant.key));
}
export function componentTokenPath(project: DesignSystemProject, token: ComponentToken) {
  const component = componentById(project, token.componentId);
  const variant = variantById(project, token.variantId);
  return [component?.key || "component", variant?.key || "default", token.state, token.property].filter(Boolean).join(".");
}
export function componentDisplayName(project: DesignSystemProject, token: ComponentToken) { return componentById(project, token.componentId)?.name || "Componente"; }
const tokenList = (pairs: [string, string][]): ScaleToken[] => pairs.map(([name, value]) => ({ id: uid(), name, value }));

function mixHex(hex: string, target: number, ratio: number) {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return hex;
  const channels = [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16));
  return `#${channels.map((channel) => Math.round(channel + (target - channel) * ratio).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function relativeLuminance(hex: string) {
  const clean = hex.replace("#", "").slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(clean)) return 0;
  const channels = [0, 2, 4].map((index) => { const value = parseInt(clean.slice(index, index + 2), 16) / 255; return value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; });
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
}
export function contrastRatio(a: string, b: string) { const [high, low] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x); return (high + .05) / (low + .05); }
export function suggestedAnchor(hex: string) { const lightness = relativeLuminance(hex); return lightness > .72 ? 300 : lightness > .48 ? 400 : lightness > .22 ? 500 : lightness > .09 ? 600 : 700; }
export function generateColorScale(base: string, anchorStep = suggestedAnchor(base), range = .78, manual: Record<string, string> = {}) {
  const anchorIndex = Math.max(0, colorSteps.indexOf(String(anchorStep)));
  return Object.fromEntries(colorSteps.map((step, index) => {
    if (manual[step]) return [step, manual[step]];
    if (index === anchorIndex) return [step, base.toUpperCase()];
    if (index < anchorIndex) return [step, mixHex(base, 255, Math.min(.96, ((anchorIndex - index) / Math.max(anchorIndex + .5, 1)) * range + .08))];
    return [step, mixHex(base, 0, Math.min(.82, ((index - anchorIndex) / Math.max(colorSteps.length - anchorIndex, 1)) * range + .02))];
  }));
}
export function makePalette(name: string, base: string): ColorPalette { const anchorStep = suggestedAnchor(base); return { id: uid(), name, base: base.toUpperCase(), anchorStep, range: .78, scale: generateColorScale(base, anchorStep, .78), manualSteps: [], creationMethod: "generated" }; }
export function makeManualPalette(name: string, scale: Record<string, string>, origin = "Manual"): ColorPalette {
  const entries = Object.entries(scale).filter(([step, color]) => step.trim() && /^#[0-9a-f]{6}$/i.test(color));
  const normalized = Object.fromEntries(entries.map(([step, color]) => [step.trim(), color.toUpperCase()]));
  const steps = Object.keys(normalized).sort((a, b) => Number(a) - Number(b));
  const anchorStep = Number(steps.find((step) => Number(step) >= 500) || steps[Math.floor(steps.length / 2)] || 500);
  const base = normalized[String(anchorStep)] || normalized[steps[0]] || "#71717A";
  return { id: uid(), name: name.trim() || "Paleta manual", base, anchorStep, range: .78, scale: normalized, manualSteps: steps, origin, creationMethod: "manual" };
}
function makeNeutralPalette(): ColorPalette { return { id: uid(), name: "Slate", base: "#71717A", anchorStep: 500, range: .78, manualSteps: [], scale: { "50": "#FAFAFA", "100": "#F4F4F5", "200": "#E4E4E7", "300": "#D4D4D8", "400": "#A1A1AA", "500": "#71717A", "600": "#52525B", "700": "#3F3F46", "800": "#27272A", "900": "#18181B" } }; }

export const fontOptions = [
  { family: "Inter", source: "google" as const, weights: [400, 500, 600, 700], styles: ["Normal", "Italic"] }, { family: "Roboto", source: "google" as const, weights: [300, 400, 500, 700], styles: ["Normal", "Italic"] },
  { family: "Open Sans", source: "google" as const, weights: [400, 500, 600, 700], styles: ["Normal", "Italic"] }, { family: "DM Sans", source: "google" as const, weights: [400, 500, 600, 700], styles: ["Normal", "Italic"] },
  { family: "Manrope", source: "google" as const, weights: [400, 500, 600, 700], styles: ["Normal"] }, { family: "Montserrat", source: "google" as const, weights: [400, 500, 600, 700], styles: ["Normal", "Italic"] },
  { family: "Source Sans 3", source: "google" as const, weights: [400, 500, 600, 700], styles: ["Normal", "Italic"] }, { family: "IBM Plex Sans", source: "google" as const, weights: [400, 500, 600, 700], styles: ["Normal", "Italic"] },
  { family: "Space Grotesk", source: "google" as const, weights: [400, 500, 600, 700], styles: ["Normal"] }, { family: "Merriweather", source: "google" as const, weights: [400, 700], styles: ["Normal", "Italic"] },
  { family: "Georgia", source: "system" as const, weights: [400, 700], styles: ["Normal", "Italic"] }, { family: "Arial", source: "system" as const, weights: [400, 700], styles: ["Normal", "Italic"] }, { family: "SF Pro", source: "system" as const, weights: [400, 500, 600, 700], styles: ["Normal"] },
];
export const ratioOptions = [{ name: "Suave", value: 1.125 }, { name: "Media", value: 1.2 }, { name: "Tercio mayor", value: 1.25 }, { name: "Cuarta perfecta", value: 1.333 }, { name: "Amplia", value: 1.5 }, { name: "Proporción áurea", value: 1.618 }];
export function fontFamilyId(family: string) { return `font-${family.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || uid()}`; }
export function makeTypographyFamily(family: string, source: FontSource = "custom", weights = [400, 500, 600, 700], styles = ["Normal"]): TypographyFamily {
  return { id: fontFamilyId(family), family: family.trim(), source, availableWeights: [...new Set(weights)], styles: [...new Set(styles)] };
}
export function generateTypeLevels(baseSize: number, ratio: number, familyId = "font-inter"): TypeLevel[] { return [["Caption", -1, 500], ["Body", 0, 400], ["Label", 0, 600], ["Heading", 2, 650], ["Display", 4, 700]].map(([name, exponent, weight]) => { const size = Math.round(baseSize * ratio ** Number(exponent) * 10) / 10; return { id: uid(), name: String(name), familyId, size, weight: Number(weight), lineHeight: size >= 32 ? 1.08 : size >= 22 ? 1.2 : 1.5, tracking: size >= 28 ? -.02 : 0 }; }); }
const defaultTypography = (): TypographyFoundation => {
  const primary = makeTypographyFamily("Inter", "google", [400, 500, 600, 700], ["Normal", "Italic"]);
  return { families: [primary], primaryFamilyId: primary.id, base: { size: 16, weight: 400, lineHeight: 1.5, tracking: 0 }, ratioName: "Tercio mayor", ratio: 1.25, levels: generateTypeLevels(16, 1.25, primary.id) };
};
export function primaryTypographyFamily(typography: TypographyFoundation) { return typography.families.find((item) => item.id === typography.primaryFamilyId) || typography.families[0]; }
export function typographyFamilyForLevel(typography: TypographyFoundation, level: TypeLevel) { return typography.families.find((item) => item.id === level.familyId) || primaryTypographyFamily(typography); }
export function typographyLevelForRole(typography: TypographyFoundation, role: "caption" | "body" | "label" | "heading" | "display") {
  return typography.levels.find((level) => level.name.toLowerCase() === role) || typography.levels.find((level) => role === "display" ? level.size === Math.max(...typography.levels.map((item) => item.size)) : role === "caption" ? level.size === Math.min(...typography.levels.map((item) => item.size)) : false) || typography.levels[0];
}

export const requiredSemanticIds = ["surface-default", "surface-raised", "surface-overlay", "text-primary", "text-muted", "text-on-action", "border-subtle", "border-strong", "action-primary", "action-hover", "action-pressed", "focus-ring", "feedback-success", "feedback-warning", "feedback-destructive", "disabled-surface", "disabled-content", "selected-surface", "selected-border"];
const semantic = (id: string, name: string, category: string, defaultRef: string, description: string, darkRef?: string): SemanticToken => ({ id, name, category, defaultRef, description, themeRefs: darkRef ? { dark: darkRef } : {}, platformRefs: {}, source: "system" });
export const defaultSemanticTokens = (): SemanticToken[] => [
  semantic("surface-default", "surface.default", "Superficie", "Slate.50", "Lienzo principal", "Slate.900"), semantic("surface-raised", "surface.raised", "Superficie", "Slate.50", "Contenedores elevados", "Slate.800"), semantic("surface-overlay", "surface.overlay", "Superficie", "Slate.900@72", "Overlays con alpha incorporado", "Slate.900@76"),
  semantic("text-primary", "text.primary", "Texto", "Slate.900", "Texto principal", "Slate.50"), semantic("text-muted", "text.muted", "Texto", "Slate.600", "Texto secundario", "Slate.300"), semantic("text-on-action", "text.on-action", "Texto", "Slate.50", "Contenido sobre acciones", "Slate.50"),
  semantic("border-subtle", "border.subtle", "Borde", "Slate.200", "Separación suave", "Slate.700"), semantic("border-strong", "border.strong", "Borde", "Slate.400", "Separación enfática", "Slate.500"), semantic("action-primary", "action.primary", "Acción", "Indigo.600", "Acción principal", "Indigo.600"),
  semantic("action-hover", "action.hover", "Acción", "Indigo.700", "Estado hover", "Indigo.700"), semantic("action-pressed", "action.pressed", "Acción", "Indigo.800", "Estado presionado", "Indigo.800"), semantic("focus-ring", "focus.ring", "Foco", "Indigo.500", "Indicador de foco", "Indigo.300"),
  semantic("feedback-success", "feedback.success", "Feedback", "Emerald.700", "Confirmación positiva", "Emerald.500"), semantic("feedback-warning", "feedback.warning", "Feedback", "Amber.700", "Advertencia", "Amber.500"), semantic("feedback-destructive", "feedback.destructive", "Feedback", "Rose.700", "Error o acción destructiva", "Rose.700"),
  semantic("disabled-surface", "disabled.surface", "Estado", "Slate.200", "Superficie deshabilitada", "Slate.700"), semantic("disabled-content", "disabled.content", "Estado", "Slate.500", "Contenido deshabilitado", "Slate.500"), semantic("selected-surface", "selected.surface", "Estado", "Indigo.100", "Control seleccionado", "Indigo.800"), semantic("selected-border", "selected.border", "Estado", "Indigo.600", "Borde seleccionado", "Indigo.300"),
];
const stateKeys = new Set(["default", "hover", "focus", "pressed", "active", "selected", "disabled", "error", "warning", "success", "open", "closed", "readonly", "checked", "unchecked", "indeterminate", "complete", "empty", "loading"]);
function parseLegacyComponentPath(path: string, component: string) {
  const parts = path.split(".").map(tokenKey).filter(Boolean);
  const second = parts[1] || "default";
  const isState = stateKeys.has(second);
  const variantKey = isState ? "default" : second;
  const third = parts[2] || "value";
  const state = isState ? second : stateKeys.has(third) ? third : "default";
  const property = isState ? third : stateKeys.has(third) ? parts[3] || "background" : third;
  const componentId = componentIdForName(component);
  return { componentId, variantId: `variant-${componentId.replace(/^component-/, "")}-${variantKey}`, state, property };
}
const componentToken = (id: string, key: string, component: string, reference: string, name: string): ComponentToken => {
  const parsed = parseLegacyComponentPath(key, component);
  return { id, key, name, ...parsed, valueType: inferValueType(reference, parsed.property), reference, platformRefs: {}, description: name };
};
export const defaultComponentTokens = (): ComponentToken[] => [
  componentToken("button-primary-bg", "button.primary.background", "Button", "semantic:action-primary", "Fondo primario"),
  componentToken("button-primary-fg", "button.primary.foreground", "Button", "semantic:text-on-action", "Contenido sobre acción"),
  componentToken("button-primary-hover", "button.primary.hover", "Button", "semantic:action-hover", "Estado hover"),
  componentToken("button-primary-pressed", "button.primary.pressed", "Button", "semantic:action-pressed", "Estado presionado"),
  componentToken("button-radius", "button.primary.radius", "Button", "primitive:radii.sm", "Radio del control"),
  componentToken("button-destructive-bg", "button.destructive.background", "Button", "semantic:feedback-destructive", "Acción destructiva"),
  componentToken("link-fg", "link.default.foreground", "Link", "semantic:action-primary", "Texto del vínculo"),
  componentToken("link-focus", "link.focus.ring", "Link", "semantic:focus-ring", "Foco del vínculo"),
  ...["input", "textarea", "select"].flatMap((component) => [
    componentToken(`${component}-bg`, `${component}.default.background`, component, "semantic:surface-raised", "Fondo"),
    componentToken(`${component}-border`, `${component}.default.border`, component, "semantic:border-subtle", "Borde"),
    componentToken(`${component}-focus`, `${component}.focus.border`, component, "semantic:focus-ring", "Foco"),
    componentToken(`${component}-error`, `${component}.error.border`, component, "semantic:feedback-destructive", "Error"),
  ]),
  componentToken("input-fg", "input.default.foreground", "Input", "semantic:text-primary", "Contenido"),
  componentToken("input-disabled-bg", "input.disabled.background", "Input", "semantic:disabled-surface", "Fondo deshabilitado"),
  componentToken("input-disabled-fg", "input.disabled.foreground", "Input", "semantic:disabled-content", "Contenido deshabilitado"),
  componentToken("input-focus-ring", "input.focus.ring", "Input", "semantic:focus-ring", "Anillo de foco"),
  componentToken("input-error-fg", "input.error.foreground", "Input", "semantic:feedback-destructive", "Texto de error"),
  componentToken("select-menu-bg", "select.menu.background", "Select", "semantic:surface-raised", "Fondo del menú"),
  ...["checkbox", "radio"].flatMap((component) => [
    componentToken(`${component}-border`, `${component}.default.border`, component, "semantic:border-strong", "Borde"),
    componentToken(`${component}-selected`, `${component}.selected.background`, component, "semantic:selected-border", "Selección"),
    componentToken(`${component}-focus`, `${component}.focus.ring`, component, "semantic:focus-ring", "Foco"),
    componentToken(`${component}-error`, `${component}.error.border`, component, "semantic:feedback-destructive", "Error"),
  ]),
  componentToken("checkbox-fg", "checkbox.selected.foreground", "Checkbox", "semantic:text-on-action", "Marca seleccionada"),
  componentToken("checkbox-radius", "checkbox.radius", "Checkbox", "primitive:radii.sm", "Radio"),
  componentToken("control-selected-bg", "control.selected.background", "Selection", "semantic:selected-surface", "Selección compartida"),
  componentToken("control-radius", "control.radius", "Controls", "primitive:radii.sm", "Radio compartido"),
  componentToken("switch-track", "switch.track.background", "Switch", "semantic:disabled-surface", "Track"),
  componentToken("switch-selected", "switch.track.selected", "Switch", "semantic:selected-border", "Track seleccionado"),
  componentToken("switch-thumb", "switch.thumb.background", "Switch", "semantic:surface-raised", "Thumb"),
  componentToken("switch-focus", "switch.focus.ring", "Switch", "semantic:focus-ring", "Foco"),
  componentToken("tabs-fg", "tabs.item.foreground", "Tabs", "semantic:text-muted", "Item"),
  componentToken("tabs-selected", "tabs.item.selected", "Tabs", "semantic:text-primary", "Item seleccionado"),
  componentToken("tabs-indicator", "tabs.item.indicator", "Tabs", "semantic:selected-border", "Indicador"),
  componentToken("tabs-focus", "tabs.focus.ring", "Tabs", "semantic:focus-ring", "Foco"),
  componentToken("badge-neutral-bg", "badge.neutral.background", "Badge", "semantic:surface-raised", "Fondo neutral"),
  componentToken("badge-selected-bg", "badge.selected.background", "Badge", "semantic:selected-surface", "Fondo seleccionado"),
  componentToken("alert-info-border", "alert.info.border", "Alert", "semantic:focus-ring", "Borde informativo"),
  ...["success", "warning", "error"].flatMap((state) => [
    componentToken(`badge-${state}-fg`, `badge.${state}.foreground`, "Badge", `semantic:feedback-${state === "error" ? "destructive" : state}`, "Contenido"),
    componentToken(`badge-${state}-bg`, `badge.${state}.background`, "Badge", `semantic:feedback-${state === "error" ? "destructive" : state}`, "Fondo tonal"),
    componentToken(`alert-${state}-fg`, `alert.${state}.foreground`, "Alert", `semantic:feedback-${state === "error" ? "destructive" : state}`, "Contenido"),
    componentToken(`alert-${state}-bg`, `alert.${state}.background`, "Alert", `semantic:feedback-${state === "error" ? "destructive" : state}`, "Fondo tonal"),
  ]),
  componentToken("badge-radius", "badge.radius", "Badge", "primitive:radii.pill", "Radio"),
  componentToken("card-bg", "card.container.background", "Card", "semantic:surface-raised", "Fondo"),
  componentToken("card-border", "card.container.border", "Card", "semantic:border-subtle", "Borde"),
  componentToken("card-radius", "card.container.radius", "Card", "primitive:radii.md", "Radio"),
  componentToken("card-shadow", "card.container.shadow", "Card", "primitive:shadows.sm", "Sombra"),
  componentToken("card-selected", "card.selected.border", "Card", "semantic:selected-border", "Selección"),
  componentToken("table-header", "table.header.background", "Table", "semantic:surface-raised", "Cabecera"),
  componentToken("table-row", "table.row.background", "Table", "semantic:surface-default", "Fila"),
  componentToken("table-row-hover", "table.row.hover", "Table", "semantic:selected-surface", "Hover"),
  componentToken("table-row-selected", "table.row.selected", "Table", "semantic:selected-surface", "Selección"),
  componentToken("table-divider", "table.divider.border", "Table", "semantic:border-subtle", "Divisor"),
  componentToken("divider-border", "divider.default.border", "Divider", "semantic:border-subtle", "Divisor"),
];

export function defaultComponentVariants(definitions = defaultComponentDefinitions(), tokens = defaultComponentTokens()): ComponentVariant[] {
  return definitions.flatMap((component) => {
    const ids = [...new Set(tokens.filter((token) => token.componentId === component.id).map((token) => token.variantId))];
    const variantIds = ids.length ? ids : [`variant-${component.key}-default`];
    return [...new Set(variantIds)].map((id) => {
      const key = id.replace(`variant-${component.key}-`, "") || "default";
      return { id, key, componentId: component.id, name: titleCase(key), description: `${component.name} · ${titleCase(key)}`, visibleInCatalog: true };
    });
  });
}

const baseLayout: LayoutValues = { columns: 4, margin: 16, gutter: 16, maxWidth: 480, breakpoint: 0, verticalRhythmUnit: 8, verticalRhythmEnabled: true };
const defaultPlatforms = (): Record<PlatformId, PlatformConfig> => ({
  mobile: { id: "mobile", name: "Mobile", enabled: true, inheritFrom: null, overrides: {}, scaleOverrides: {}, proposalPending: false },
  "mobile-landscape": { id: "mobile-landscape", name: "Mobile horizontal", enabled: false, inheritFrom: "mobile", overrides: { columns: 6, margin: 24, maxWidth: 760, breakpoint: 568 }, scaleOverrides: { typography: 1, spacing: 1, dimensions: 1 }, proposalPending: true },
  tablet: { id: "tablet", name: "Tablet", enabled: false, inheritFrom: "mobile", overrides: { columns: 8, margin: 32, gutter: 24, maxWidth: 1024, breakpoint: 768 }, scaleOverrides: { typography: 1.05, spacing: 1.1, dimensions: 1 }, proposalPending: true },
  desktop: { id: "desktop", name: "Desktop", enabled: false, inheritFrom: "mobile", overrides: { columns: 12, margin: 48, gutter: 24, maxWidth: 1280, breakpoint: 1200 }, scaleOverrides: { typography: 1.125, spacing: 1.2, dimensions: 1 }, proposalPending: true },
});
const defaultScales = (): Record<ScaleGroupKey, ScaleToken[]> => ({ spacing: tokenList([["2xs", "4px"], ["xs", "8px"], ["sm", "12px"], ["md", "16px"], ["lg", "24px"], ["xl", "32px"], ["2xl", "48px"], ["3xl", "64px"]]), dimensions: tokenList([["control-sm", "32px"], ["control-md", "40px"], ["control-lg", "48px"]]), radii: tokenList([["sm", "6px"], ["md", "10px"], ["lg", "16px"], ["pill", "999px"]]), borders: tokenList([["subtle", "1px"], ["strong", "2px"]]), shadows: tokenList([["sm", "0 1px 3px rgba(24,24,27,.10)"], ["md", "0 8px 24px rgba(24,24,27,.14)"], ["lg", "0 20px 50px rgba(24,24,27,.18)"]]), opacity: tokenList([["disabled-interaction", "0.42"], ["temporary-overlay", "0.68"], ["solid", "1"]]) });

export function createInitialProject(): DesignSystemProject {
  const components = defaultComponentDefinitions();
  const componentTokens = defaultComponentTokens();
  const componentVariants = defaultComponentVariants(components, componentTokens);
  return { schemaVersion: 5, projectState: "validated", id: "ds-starter", meta: { name: "Sistema inicial validado", description: "Una base completa y contrastada para explorar antes del handoff.", brandMark: "DS", updatedAt: new Date().toISOString() }, foundations: { colors: [makePalette("Indigo", "#4F46E5"), makePalette("Amber", "#D97706"), makeNeutralPalette(), makePalette("Rose", "#E11D48"), makePalette("Emerald", "#059669")], typography: defaultTypography(), scales: defaultScales(), layoutBase: baseLayout, customFoundations: [] }, semanticTokens: defaultSemanticTokens(), components, componentVariants, componentTokens, themes: [{ id: "light", name: "Claro" }, { id: "dark", name: "Oscuro" }], platforms: defaultPlatforms(), implementationProfile: { web: true, ios: true, android: true } };
}
export function createBlankProject(): DesignSystemProject {
  const base = createInitialProject();
  return { ...base, projectState: "blank", id: uid(), meta: { name: "Proyecto en blanco", description: "Configurá foundations y asigná roles para comenzar la evaluación.", brandMark: "PB", updatedAt: new Date().toISOString() }, foundations: { ...base.foundations, colors: [], customFoundations: [] }, semanticTokens: [], components: [], componentVariants: [], componentTokens: [], themes: [{ id: "light", name: "Claro" }] };
}

function parseAlphaReference(reference: string) { const [base, alpha] = reference.split("@"); return { base, alpha: alpha ? Math.max(0, Math.min(100, Number(alpha))) / 100 : 1 }; }
function withAlpha(hex: string, alpha: number) { const clean = hex.replace("#", ""); if (!/^[0-9a-f]{6}$/i.test(clean) || alpha >= 1) return hex; return `#${clean}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`.toUpperCase(); }
export function resolvePrimitiveColor(project: DesignSystemProject, reference: string) { const { base, alpha } = parseAlphaReference(reference); if (base.startsWith("#")) return withAlpha(base, alpha); const [paletteName, step] = base.split("."); const color = project.foundations.colors.find((item) => item.name === paletteName)?.scale[step]; return color ? withAlpha(color, alpha) : ""; }
export function semanticById(project: DesignSystemProject, id: string) { return project.semanticTokens.find((token) => token.id === id || token.name === id); }
export function resolveSemantic(project: DesignSystemProject, id: string, themeId: string, platform: PlatformId) { const token = semanticById(project, id); if (!token) return ""; return resolvePrimitiveColor(project, token.platformRefs[platform] || token.themeRefs[themeId] || token.defaultRef); }
export function resolveScaleToken(project: DesignSystemProject, reference: string) { const [group, name] = reference.replace("primitive:", "").split(".") as [ScaleGroupKey, string]; return project.foundations.scales[group]?.find((token) => token.name === name)?.value || ""; }
export function resolveComponentReference(project: DesignSystemProject, reference: string, themeId: string, platform: PlatformId) {
  if (reference.startsWith("semantic:")) return resolveSemantic(project, reference.slice(9), themeId, platform);
  if (reference.startsWith("primitive:")) return resolveScaleToken(project, reference);
  if (reference.startsWith("typography:")) return project.foundations.typography.families.find((family) => family.id === reference.slice(11))?.family || "";
  if (reference.startsWith("fontWeight:")) return reference.slice(11);
  if (reference.startsWith("custom:")) {
    const [, groupId, tokenId] = reference.split(":");
    return project.foundations.customFoundations.find((group) => group.id === groupId)?.tokens.find((token) => token.id === tokenId || token.name === tokenId)?.value || "";
  }
  return "";
}
export function componentTokensForVariant(project: DesignSystemProject, variantId: string): ComponentToken[] {
  const visited = new Set<string>();
  const collect = (id: string): ComponentToken[] => {
    if (visited.has(id)) return [];
    visited.add(id);
    const variant = variantById(project, id);
    const inherited = variant?.inheritsFrom ? collect(variant.inheritsFrom) : [];
    const own = project.componentTokens.filter((token) => token.variantId === id);
    const merged = new Map(inherited.map((token) => [`${token.state}:${token.property}`, token]));
    own.forEach((token) => merged.set(`${token.state}:${token.property}`, token));
    return [...merged.values()];
  };
  return collect(variantId);
}
export function resolveComponent(project: DesignSystemProject, id: string, themeId: string, platform: PlatformId) {
  const token = project.componentTokens.find((item) => item.id === id || item.key === id || componentTokenPath(project, item) === id);
  if (!token) return "";
  const reference = token.platformRefs[platform] || token.reference;
  return resolveComponentReference(project, reference, themeId, platform);
}
export function variantInheritanceWouldCycle(project: DesignSystemProject, variantId: string, parentId?: string) {
  if (!parentId) return false;
  const visited = new Set([variantId]);
  let cursor: string | undefined = parentId;
  while (cursor) {
    if (visited.has(cursor)) return true;
    visited.add(cursor);
    cursor = variantById(project, cursor)?.inheritsFrom;
  }
  return false;
}
export function allColorReferences(project: DesignSystemProject) {
  const paletteReferences = project.foundations.colors.flatMap((item) => Object.keys(item.scale).map((step) => `${item.name}.${step}`));
  const assignedReferences = project.semanticTokens.flatMap((token) => [token.defaultRef, ...Object.values(token.themeRefs), ...Object.values(token.platformRefs)]).filter((reference): reference is string => Boolean(reference) && !reference.startsWith("#"));
  return [...new Set([...paletteReferences, ...assignedReferences])];
}
export function resolveLayout(project: DesignSystemProject, platformId: PlatformId): LayoutValues { const platform = project.platforms[platformId]; if (!platform || !platform.inheritFrom) return { ...project.foundations.layoutBase, ...platform?.overrides }; return { ...resolveLayout(project, platform.inheritFrom), ...platform.overrides }; }
export function resolveResponsiveScale(project: DesignSystemProject, platformId: PlatformId): ResponsiveScaleValues { const platform = project.platforms[platformId]; const base = platform?.inheritFrom ? resolveResponsiveScale(project, platform.inheritFrom) : { typography: 1, spacing: 1, dimensions: 1 }; return { ...base, ...platform?.scaleOverrides }; }

type LegacyTypography = Partial<Omit<TypographyFoundation, "levels">> & { family?: string; source?: FontSource; availableWeights?: number[]; styles?: string[]; levels?: Array<Partial<TypeLevel> & Pick<TypeLevel, "name" | "size" | "weight" | "lineHeight" | "tracking">> };
type LegacyLayout = Partial<LayoutValues> & { baseline?: number; baselineEnabled?: boolean };
type LegacyComponentToken = Partial<ComponentToken> & { id: string; name?: string; component?: string; reference?: string; platformRefs?: Partial<Record<PlatformId, string>>; description?: string };
type LegacyFoundations = Omit<Partial<DesignSystemProject["foundations"]>, "typography" | "layoutBase"> & { typography?: LegacyTypography; layoutBase?: LegacyLayout; spacing?: ScaleToken[]; dimensions?: ScaleToken[]; radii?: ScaleToken[]; borders?: ScaleToken[]; shadows?: ScaleToken[]; opacity?: ScaleToken[]; customGroups?: { id: string; name: string; tokens: ScaleToken[] }[] };
type LegacyProject = Omit<Partial<DesignSystemProject>, "schemaVersion" | "foundations" | "componentTokens"> & { schemaVersion?: number; meta?: DesignSystemProject["meta"] & { target?: string }; foundations?: LegacyFoundations; componentTokens?: LegacyComponentToken[] };
function normalizeTypography(input?: LegacyTypography): TypographyFoundation {
  const fallback = defaultTypography();
  if (!input) return fallback;
  const legacyFamily = input.family?.trim();
  const families = (input.families?.length ? input.families : legacyFamily ? [makeTypographyFamily(legacyFamily, input.source || "custom", input.availableWeights || [400, 500, 600, 700], input.styles || ["Normal"])] : fallback.families)
    .filter((family) => family.family.trim())
    .map((family) => ({ ...family, id: family.id || fontFamilyId(family.family), availableWeights: family.availableWeights?.length ? family.availableWeights : [400, 500, 600, 700], styles: family.styles?.length ? family.styles : ["Normal"] }));
  const primaryFamilyId = families.some((family) => family.id === input.primaryFamilyId) ? String(input.primaryFamilyId) : families[0].id;
  const levels = input.levels?.length ? input.levels.map((level) => ({ ...level, id: level.id || uid(), familyId: families.some((family) => family.id === level.familyId) ? String(level.familyId) : primaryFamilyId })) as TypeLevel[] : generateTypeLevels(input.base?.size || fallback.base.size, input.ratio || fallback.ratio, primaryFamilyId);
  return { families, primaryFamilyId, base: { ...fallback.base, ...input.base }, ratioName: input.ratioName || fallback.ratioName, ratio: input.ratio || fallback.ratio, levels };
}
export function migrateProject(input: unknown): DesignSystemProject {
  const fallback = createInitialProject();
  if (!input || typeof input !== "object") return fallback;
  const candidate = input as LegacyProject;
  if (candidate.id === "ds-nova" && candidate.meta?.name === "Nova Design System") return fallback;
  const isBlank = candidate.projectState === "blank";
  const legacyColors = candidate.foundations?.colors?.map((item) => { const base = item.base || "#4F46E5"; const anchorStep = item.anchorStep || suggestedAnchor(base); return { id: item.id || uid(), name: item.name || "Paleta", base, anchorStep, range: item.range ?? .78, scale: item.scale || generateColorScale(base, anchorStep), manualSteps: item.manualSteps || [], origin: item.origin, sourceUrl: item.sourceUrl, creationMethod: item.creationMethod }; });
  const rawLayout = candidate.foundations?.layoutBase;
  const layoutBase: LayoutValues = { ...fallback.foundations.layoutBase, ...rawLayout, verticalRhythmUnit: rawLayout?.verticalRhythmUnit ?? rawLayout?.baseline ?? fallback.foundations.layoutBase.verticalRhythmUnit, verticalRhythmEnabled: rawLayout?.verticalRhythmEnabled ?? rawLayout?.baselineEnabled ?? fallback.foundations.layoutBase.verticalRhythmEnabled };
  const rawTokens = candidate.componentTokens ?? (isBlank ? [] : fallback.componentTokens);
  const suppliedComponents = candidate.components?.map((item) => ({ ...item, id: item.id || `component-${componentKey(item.key || item.name)}`, key: componentKey(item.key || item.name), source: item.source || "custom" })) || [];
  const components = [...suppliedComponents];
  const ensureComponent = (name: string, source: "catalog" | "custom" = "custom") => {
    const key = componentAlias[name.trim().toLowerCase()] || componentKey(name);
    let component = components.find((item) => item.key === key || item.id === `component-${key}`);
    if (!component) {
      const catalog = defaultComponentDefinitions().find((item) => item.key === key);
      component = catalog || { id: `component-${key}`, key, name: name.trim() || titleCase(key), description: "Componente migrado", source };
      components.push(component);
    }
    return component;
  };
  const componentTokens: ComponentToken[] = rawTokens.map((raw) => {
    if (raw.componentId && raw.variantId && raw.key) {
      const component = suppliedComponents.find((item) => item.id === raw.componentId) || ensureComponent(raw.key.split(".")[0]);
      return { id: raw.id || uid(), key: tokenKey(raw.key), name: raw.name || raw.description || titleCase(raw.property || "token"), componentId: component.id, variantId: raw.variantId, state: raw.state || "default", property: raw.property || "value", valueType: raw.valueType || inferValueType(raw.reference || "", raw.property), reference: raw.reference || "", platformRefs: raw.platformRefs || {}, description: raw.description || raw.name || "Token de componente" };
    }
    const key = tokenKey(raw.name || raw.id);
    const componentName = ("component" in raw ? raw.component : undefined) || key.split(".")[0] || "Componente";
    const component = ensureComponent(componentName, defaultComponentDefinitions().some((item) => item.key === componentKey(componentName)) ? "catalog" : "custom");
    const parsed = parseLegacyComponentPath(key, component.key);
    return { id: raw.id || uid(), key, name: raw.description || titleCase(parsed.property), componentId: component.id, variantId: parsed.variantId, state: parsed.state, property: parsed.property, valueType: inferValueType(raw.reference || "", parsed.property), reference: raw.reference || "", platformRefs: raw.platformRefs || {}, description: raw.description || "Token migrado" };
  });
  const obsoleteStarterVariantIds = new Set(["variant-button-secondary", "variant-button-tertiary", "variant-button-custom"]);
  const suppliedVariants = candidate.componentVariants?.map((item) => ({ ...item, id: item.id || `variant-${componentKey(item.componentId)}-${componentKey(item.key || item.name)}`, key: componentKey(item.key || item.name), visibleInCatalog: item.visibleInCatalog !== false })).filter((variant) => !obsoleteStarterVariantIds.has(variant.id) || componentTokens.some((token) => token.variantId === variant.id)) || [];
  const componentVariants = [...suppliedVariants];
  componentTokens.forEach((token) => {
    if (componentVariants.some((item) => item.id === token.variantId)) return;
    const component = components.find((item) => item.id === token.componentId);
    const key = token.variantId.replace(`variant-${component?.key || "component"}-`, "") || "legacy";
    componentVariants.push({ id: token.variantId, key, componentId: token.componentId, name: titleCase(key), description: "Variante migrada", visibleInCatalog: true });
  });
  components.forEach((component) => { if (!componentVariants.some((variant) => variant.componentId === component.id)) componentVariants.push({ id: `variant-${component.key}-default`, key: "default", componentId: component.id, name: "Default", description: `${component.name} · Default`, visibleInCatalog: true }); });
  const scales = candidate.foundations?.scales;
  const platforms = Object.fromEntries(platformOrder.map((id) => {
    const current = candidate.platforms?.[id];
    const overrides = current?.overrides as (Partial<LayoutValues> & { baseline?: number; baselineEnabled?: boolean }) | undefined;
    const normalizedOverrides = overrides ? { ...overrides, verticalRhythmUnit: overrides.verticalRhythmUnit ?? overrides.baseline, verticalRhythmEnabled: overrides.verticalRhythmEnabled ?? overrides.baselineEnabled } : {};
    delete (normalizedOverrides as { baseline?: number }).baseline;
    delete (normalizedOverrides as { baselineEnabled?: boolean }).baselineEnabled;
    return [id, { ...fallback.platforms[id], ...current, overrides: normalizedOverrides, scaleOverrides: { ...fallback.platforms[id].scaleOverrides, ...current?.scaleOverrides } }];
  })) as Record<PlatformId, PlatformConfig>;
  return {
    ...fallback,
    ...candidate,
    schemaVersion: 5,
    projectState: candidate.projectState || "validated",
    id: candidate.id || fallback.id,
    meta: { ...fallback.meta, ...candidate.meta, updatedAt: candidate.meta?.updatedAt || new Date().toISOString() },
    foundations: {
      ...fallback.foundations,
      ...candidate.foundations,
      colors: legacyColors ?? (isBlank ? [] : fallback.foundations.colors),
      typography: normalizeTypography(candidate.foundations?.typography),
      scales: {
        spacing: scales?.spacing ?? candidate.foundations?.spacing ?? fallback.foundations.scales.spacing,
        dimensions: scales?.dimensions ?? candidate.foundations?.dimensions ?? fallback.foundations.scales.dimensions,
        radii: scales?.radii ?? candidate.foundations?.radii ?? fallback.foundations.scales.radii,
        borders: scales?.borders ?? candidate.foundations?.borders ?? fallback.foundations.scales.borders,
        shadows: scales?.shadows ?? candidate.foundations?.shadows ?? fallback.foundations.scales.shadows,
        opacity: scales?.opacity ?? candidate.foundations?.opacity ?? fallback.foundations.scales.opacity,
      },
      layoutBase,
      customFoundations: candidate.foundations?.customFoundations ?? candidate.foundations?.customGroups?.map((group) => ({ ...group, description: "Foundation personalizado" })) ?? [],
    },
    semanticTokens: candidate.semanticTokens ?? (isBlank ? [] : fallback.semanticTokens),
    components,
    componentVariants,
    componentTokens,
    themes: candidate.themes?.length ? candidate.themes : [{ id: "light", name: "Claro" }],
    platforms,
    implementationProfile: { ...fallback.implementationProfile, ...candidate.implementationProfile },
  } as DesignSystemProject;
}
