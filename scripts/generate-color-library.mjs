import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import tailwindColors from "tailwindcss/colors";
import * as antColors from "@ant-design/colors";
import * as carbonColors from "@carbon/colors";
import * as radixColors from "@radix-ui/colors";
import { colors as heroColors, semanticColors as heroSemanticColors } from "@heroui/theme/colors";
import materialColorsModule from "material-colors";

const require = createRequire(import.meta.url);
const atlaskitPalette = require("@atlaskit/tokens/dist/cjs/entry-points/palettes-raw.js").default;
const openColors = JSON.parse(readFileSync(new URL("../node_modules/open-color/open-color.json", import.meta.url), "utf8"));
const reasonableCss = readFileSync(new URL("../node_modules/reasonable-colors/reasonable-colors.css", import.meta.url), "utf8");

const title = (value) => value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
const hex = (value) => value.toUpperCase();
const isScale = (value) => value && typeof value === "object" && Object.values(value).filter((item) => typeof item === "string").length >= 3;

function oklchToHex(value) {
  if (value.startsWith("#")) return hex(value);
  const match = value.match(/oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)/);
  if (!match) return value;
  const L = Number(match[1]) / 100;
  const C = Number(match[2]);
  const h = Number(match[3]) * Math.PI / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const channels = linear.map((channel) => Math.round(Math.max(0, Math.min(1, channel <= 0.0031308 ? channel * 12.92 : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055)) * 255));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function normalizeScale(scale, prefix = "") {
  return Object.fromEntries(Object.entries(scale).flatMap(([key, value]) => {
    if (typeof value !== "string") return [];
    const step = key.replace(prefix, "").replace(/^a/i, "1");
    return /^\d+$/.test(step) && (/^#/.test(value) || /^oklch/.test(value)) ? [[step, oklchToHex(value)]] : [];
  }));
}

function palette(id, name, scale, description = "Escala publicada por la biblioteca.") {
  return { id, name, description, scale };
}

function library(id, name, description, sourceUrl, palettes) {
  return { id, name, description, sourceUrl, palettes: palettes.filter((item) => Object.keys(item.scale).length >= 3) };
}

const shadcnNames = ["slate", "gray", "zinc", "neutral", "stone"];
const shadcn = shadcnNames.map((name) => palette(`shadcn-${name}`, title(name), normalizeScale(tailwindColors[name]), "Color base disponible en la configuración visual de shadcn/ui."));

const tailwind = Object.entries(tailwindColors).filter(([, value]) => isScale(value)).map(([name, scale]) => palette(`tailwind-${name}`, title(name), normalizeScale(scale)));

const ant = Object.entries(antColors.presetPalettes).map(([name, scale]) => palette(`ant-${name}`, title(name), Object.fromEntries(scale.map((value, index) => [String((index + 1) * 100), hex(value)])), `Rampa oficial de Ant Design con ${scale.length} tonos.`));

const atlaskitGroups = Object.groupBy(atlaskitPalette.filter((token) => /^#[0-9A-F]{6}$/i.test(token.value)), (token) => token.attributes.category);
const atlaskit = Object.entries(atlaskitGroups).map(([name, tokens]) => palette(`atlassian-${name}`, title(name), Object.fromEntries(tokens.map((token) => [token.name.match(/(\d+)$/)?.[1], hex(token.value)]).filter(([step]) => step)), "Paleta primitiva publicada por Atlassian Design System."));

const heroCommon = Object.entries(heroColors).filter(([, value]) => isScale(value)).map(([name, scale]) => palette(`heroui-${name}`, title(name), normalizeScale(scale), "Escala común de HeroUI."));
const heroSemantic = ["light", "dark"].flatMap((mode) => Object.entries(heroSemanticColors[mode]).filter(([, value]) => isScale(value)).map(([name, scale]) => palette(`heroui-${mode}-${name}`, `${title(mode)} · ${title(name)}`, normalizeScale(scale), `Rampa semántica ${mode === "light" ? "clara" : "oscura"} de HeroUI, importada como foundation editable.`)));

const carbon = Object.entries(carbonColors.colors).filter(([, value]) => isScale(value)).map(([name, scale]) => palette(`carbon-${name}`, title(name), normalizeScale(scale), "Escala del IBM Design Language utilizada por Carbon."));

const radixNames = ["gray", "mauve", "slate", "sage", "olive", "sand", "gold", "bronze", "brown", "yellow", "amber", "orange", "tomato", "red", "ruby", "crimson", "pink", "plum", "purple", "violet", "iris", "indigo", "blue", "cyan", "teal", "jade", "green", "grass", "lime", "mint", "sky"];
const radix = radixNames.flatMap((name) => [
  palette(`radix-${name}`, title(name), normalizeScale(radixColors[name], name), "Escala sólida clara de Radix Colors."),
  palette(`radix-${name}-dark`, `${title(name)} · Dark`, normalizeScale(radixColors[`${name}Dark`], name), "Escala sólida oscura de Radix Colors."),
]);

const reasonableMap = {};
for (const match of reasonableCss.matchAll(/--color-([a-z]+)-(\d):\s*(#[0-9a-f]{6})/gi)) {
  reasonableMap[match[1]] ||= {};
  reasonableMap[match[1]][String(Number(match[2]) * 100)] = hex(match[3]);
}
const reasonable = Object.entries(reasonableMap).map(([name, scale]) => palette(`reasonable-${name}`, title(name), scale, "Seis tonos con diferencias de contraste predecibles."));

const open = Object.entries(openColors).filter(([, value]) => Array.isArray(value)).map(([name, values]) => palette(`open-${name}`, title(name), Object.fromEntries(values.map((value, index) => [String(index * 100), hex(value)])), "Escala de Open Color."));

const materialColors = materialColorsModule.default || materialColorsModule;
const material = Object.entries(materialColors).filter(([, value]) => isScale(value)).map(([name, scale]) => palette(`material-${name}`, title(name), normalizeScale(scale), "Paleta clásica de Material Design 2, incluidos acentos cuando están disponibles."));

const appleValues = {
  red: ["#FF383C", "#FF4245", "#E9152D", "#FF6165"], orange: ["#FF8D28", "#FF9230", "#C55300", "#FFA056"], yellow: ["#FFCC00", "#FFD600", "#A16A00", "#FEDF43"], green: ["#34C759", "#30D158", "#007D1F", "#31DE4B"], mint: ["#00C8B3", "#63E6E2", "#0C817B", "#66D4CF"], teal: ["#00C3D0", "#40C8E0", "#008299", "#5DE6FF"], cyan: ["#55BEF0", "#5AC8F5", "#0071A4", "#70D7FF"], blue: ["#007AFF", "#0A84FF", "#0040DD", "#409CFF"], indigo: ["#5856D6", "#5E5CE6", "#3634A3", "#7D7AFF"], purple: ["#AF52DE", "#BF5AF2", "#8944AB", "#DA8FFF"], pink: ["#FF2D55", "#FF375F", "#D30F45", "#FF6482"], brown: ["#A2845E", "#AC8E68", "#7F6545", "#B59469"],
};
const apple = Object.entries(appleValues).map(([name, values]) => palette(`apple-${name}`, `System ${title(name)}`, { "100": values[0], "300": values[1], "700": values[2], "900": values[3] }, "Valores de referencia para apariencias clara, oscura y contraste aumentado; en producto Apple recomienda usar colores dinámicos del sistema."));

const libraries = [
  library("shadcn", "shadcn/ui", "Bases neutrales usadas para iniciar temas de shadcn/ui.", "https://v3.shadcn.com/colors", shadcn),
  library("tailwind", "Tailwind CSS", "Paleta completa de utilidades, incluidas las nuevas familias neutrales.", "https://tailwindcss.com/docs/colors", tailwind),
  library("ant", "Ant Design", "Doce familias cromáticas oficiales de Ant Design.", "https://ant.design/docs/spec/colors", ant),
  library("atlassian", "Atlassian Design System", "Rampas primitivas claras y oscuras publicadas por Atlassian.", "https://atlassian.design/foundations/color/color-palette/", atlaskit),
  library("heroui", "HeroUI", "Colores comunes y rampas semánticas claras y oscuras.", "https://heroui.com/en/docs/react/getting-started/colors", [...heroCommon, ...heroSemantic]),
  library("apple", "Apple HIG", "Colores dinámicos del sistema representados como referencias editables.", "https://developer.apple.com/design/human-interface-guidelines/color", apple),
  library("material", "Material Design 2", "Paletas clásicas y colores de acento de Material Design 2.", "https://m2.material.io/design/color/the-color-system.html", material),
  library("carbon", "Carbon Design System", "Rampas del IBM Design Language utilizadas por Carbon.", "https://carbondesignsystem.com/elements/color/tokens/", carbon),
  library("radix", "Radix Colors", "Escalas sólidas claras y oscuras diseñadas por función de interfaz.", "https://www.radix-ui.com/colors", radix),
  library("reasonable", "Reasonable Colors", "Veinticinco familias accesibles de seis tonos.", "https://www.reasonable.work/colors/", reasonable),
  library("open", "Open Color", "Trece escalas abiertas y equilibradas para interfaces.", "https://yeun.github.io/open-color/", open),
];

writeFileSync(new URL("../app/lib/color-library.generated.json", import.meta.url), `${JSON.stringify(libraries, null, 2)}\n`);
console.log(`Generated ${libraries.length} libraries and ${libraries.reduce((sum, item) => sum + item.palettes.length, 0)} palettes.`);
