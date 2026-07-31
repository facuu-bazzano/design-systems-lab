import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const ui = readFileSync(new URL("../app/components/ui/LabUI.tsx", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../app/components/Catalog.tsx", import.meta.url), "utf8");
const health = readFileSync(new URL("../app/components/HealthView.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const figmaMcp = readFileSync(new URL("../app/lib/figma-mcp.ts", import.meta.url), "utf8");
const icons = readFileSync(new URL("../app/components/ui/Icons.tsx", import.meta.url), "utf8");
const uiStories = readFileSync(new URL("../app/components/ui/LabUI.stories.tsx", import.meta.url), "utf8");

function relativeLuminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((value) => {
    const normalized = Number.parseInt(value, 16) / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(a, b) {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

test("exportación usa un diálogo modal con nombre, Escape y restauración de foco", () => {
  assert.match(page, /<Dialog open=\{open\}/);
  assert.match(ui, /<dialog ref=\{dialogRef\}/);
  assert.match(ui, /aria-labelledby=\{titleId\}/);
  assert.match(ui, /dialog\.showModal\(\)/);
  assert.match(ui, /document\.body\.style\.overflow = "hidden"/);
  assert.match(ui, /onCancel=\{\(event\) => \{ event\.preventDefault\(\); close\(\); \}\}/);
  assert.match(ui, /returnFocusRef\.current\?\.focus\(\)/);
});

test("importación anuncia éxito y conserva errores con recuperación", () => {
  assert.match(page, /role="status" aria-live="polite"/);
  assert.match(page, /role="alert" aria-live="assertive"/);
  assert.match(page, /Elegir otro archivo/);
  assert.match(page, /Verificá que sea un archivo de proyecto/);
});

test("navegación SPA expone sección actual, skip link y foco solicitado", () => {
  assert.match(page, /href="#lab-main">Saltar al contenido/);
  assert.match(page, /aria-current=\{section === item\.id \? "page" : undefined\}/);
  assert.match(page, /navigationRequestedRef\.current/);
  assert.match(page, /heading\.focus\(\{ preventScroll: true \}\)/);
  assert.match(page, /document\.title =/);
  assert.match(page, /heading\.dataset\.programmaticFocus = "true"/);
  assert.match(css, /h1\[data-programmatic-focus=true\]:focus\{outline:0\}/);
});

test("diálogo enfoca una acción real y no el contenedor visual", () => {
  assert.match(ui, /\[data-dialog-close\]/);
  assert.match(ui, /data-dialog-close onClick=\{close\}/);
  assert.match(css, /\.ui-dialog-panel\{[^}]*grid-template-rows:auto minmax\(0,1fr\)/);
  assert.match(css, /\.ui-dialog-body\{[^}]*overflow:auto/);
  assert.match(css, /\.ui-dialog-header\{[^}]*border-bottom/);
});

test("menús no modales conservan el scroll y overlays anidados permanecen dentro del diálogo", () => {
  assert.match(ui, /modal = false/);
  assert.match(ui, /<DropdownPrimitive\.Root modal=\{modal\}>/);
  assert.match(ui, /<SelectPrimitive\.Portal container=\{portal \|\| undefined\}>/);
  assert.match(ui, /<Popover\.Portal container=\{portal \|\| undefined\}>/);
  assert.match(css, /\.export-format-stack\{display:grid;gap:16px\}/);
});

test("Salud conserva un único main y deriva la evidencia a escenarios", async () => {
  const scenarios = readFileSync(new URL("../app/components/ScenarioExplorer.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(health, /<main[> ]/);
  assert.match(health, /onOpenScenarios/);
  assert.doesNotMatch(health, /health-scenarios/);
  assert.doesNotMatch(scenarios, /<main[> ]/);
  assert.match(scenarios, /<section ref=\{scrollRef\} id=\{contentId\}/);
  assert.match(scenarios, /aria-label=\{`Contenido de/);
});

test("combobox tipográfico implementa listbox y teclado APG", () => {
  assert.match(ui, /role="combobox"/);
  assert.match(ui, /role="listbox"/);
  assert.match(ui, /role="option"/);
  assert.match(ui, /aria-activedescendant/);
  for (const key of ["ArrowDown", "ArrowUp", "Enter", "Escape"]) assert.match(ui, new RegExp(`event\\.key === "${key}"`));
});

test("campos del Lab y Catálogo asocian ayuda y error", () => {
  assert.match(ui, /aria-describedby=\{describedBy\}/);
  assert.match(ui, /aria-invalid=\{error \? true/);
  assert.match(catalog, /"aria-describedby": descriptionId/);
  assert.match(catalog, /<small id=\{descriptionId\}/);
});

test("campos editables móviles usan 16px sin alterar toda la tipografía", () => {
  assert.match(css, /@media\(max-width:800px\)\{\.ui-field input,[^}]+font-size:16px/);
  assert.doesNotMatch(css, /@media\(max-width:800px\)\{body[^}]+font-size:16px/);
});

test("motion interno usa primitives y conserva feedback con movimiento reducido", () => {
  for (const token of ["--motion-duration-control", "--motion-duration-popover", "--motion-duration-drawer", "--motion-ease-drawer"]) assert.match(css, new RegExp(token));
  assert.match(css, /ui-menu-content\[data-state=open\]/);
  assert.match(css, /ui-dialog-drawer\[open\] \.ui-dialog-panel/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(css, /prefers-reduced-motion:reduce\)\{\*\{[^}]*transition:none/);
});

test("contraste sobre acento se resuelve con tokens internos compartidos", () => {
  assert.match(css, /--ui-on-accent:#fff/);
  assert.match(css, /--ui-on-accent:#18181b/);
  assert.match(css, /\.ui-checkbox,\.ui-checkbox\[data-state=checked\]\{color:var\(--ui-on-accent\)\}/);
  assert.match(css, /border-left-color:var\(--ui-accent-separator\)!important/);
});

test("navegación móvil comunica continuidad y centra la sección activa", () => {
  assert.match(page, /navigationRef\.current\?\.querySelector<HTMLElement>\("\[aria-current='page'\]"\)/);
  assert.match(page, /scrollIntoView\(\{ block: "nearest", inline: "center"/);
  assert.match(css, /\.sidebar-v4,\.catalog-side-nav\{scroll-snap-type:x proximity/);
  assert.match(css, /mask-image:linear-gradient/);
});

test("métricas cero son datos estáticos y las positivas son navegables", () => {
  assert.match(health, /if \(!count\) return <div className="health-stat"/);
  assert.match(health, /if \(!value\) return <span className="metric-zero"/);
  assert.match(health, /return <button className=\{`metric-link/);
  assert.match(health, /Sin hallazgos/);
});

test("exportación GPT + Figma MCP es explícita, validada y no escribe desde el navegador", () => {
  assert.match(page, /Paquete para GPT \+ Figma MCP/);
  assert.match(page, /Descargar paquete MCP/);
  assert.match(page, /Solicitar simulación y resumen antes de escribir/);
  assert.match(page, /buildFigmaMcpPackage/);
  assert.match(figmaMcp, /conflictPolicy/);
  assert.match(figmaMcp, /TARGET_REQUIRED_AT_RUNTIME/);
  assert.match(figmaMcp, /Este paquete no ejecuta acciones por sí mismo/);
  assert.doesNotMatch(figmaMcp, /fetch\(|XMLHttpRequest|Authorization:/);
});

test("los controles internos comparten estados visibles sin controles nativos divergentes", () => {
  for (const source of [page, catalog, health, ui]) {
    assert.doesNotMatch(source, /<select\b|type=["'](?:checkbox|radio)["']/);
  }
  assert.match(css, /\.ui-control-line\.is-disabled\{opacity:1/);
  assert.match(css, /\.ui-switch\{width:44px;height:24px/);
  assert.match(css, /\.ui-switch\[data-state=checked\] span\{transform:translateX\(20px\)/);
  assert.match(css, /\.ui-switch:disabled\[data-state=checked\]/);
  assert.match(css, /\.ui-checkbox>span,\.ui-radio>span\{width:100%;height:100%;display:grid;place-items:center/);
  assert.match(css, /\.ui-checkbox\[data-state=indeterminate\]/);
  assert.match(css, /\.ui-checkbox:focus-visible[^}]+\.ui-switch:focus-visible/);
});

test("el contrato cromático de controles supera 3:1 en claro y oscuro", () => {
  const requiredPairs = [
    ["#52525b", "#ffffff"], ["#ffffff", "#52525b"], ["#5b21b6", "#ffffff"],
    ["#7c3aed", "#ffffff"], ["#71717a", "#ffffff"], ["#a1a1aa", "#18181b"],
    ["#18181b", "#a1a1aa"], ["#c4b5fd", "#18181b"], ["#8b7bd1", "#18181b"],
  ];
  for (const [foreground, background] of requiredPairs) {
    assert.ok(contrastRatio(foreground, background) >= 3, `${foreground} / ${background} debe alcanzar 3:1`);
  }
  for (const token of ["--ui-control-border:#71717a", "--ui-control-track:#52525b", "--ui-control-active-disabled:#7c3aed", "--ui-control-border:#a1a1aa", "--ui-control-track:#a1a1aa", "--ui-control-active-disabled:#8b7bd1"]) {
    assert.match(css, new RegExp(token));
  }
});

test("iconos y chevrons se resuelven desde la librería compartida", () => {
  assert.match(icons, /Minus as MinusIcon/);
  assert.match(ui, /<CheckIcon className="ui-checkbox-check"/);
  assert.match(ui, /<MinusIcon className="ui-checkbox-minus"/);
  assert.match(page, /<ChevronDownIcon aria-hidden="true"/);
  assert.doesNotMatch(page, /import\s*\{[^}]*ChevronDown[^}]*\}\s*from\s*["']lucide-react["']/s);
  assert.match(css, /\.ui-select-trigger>span:last-child svg,\.ui-combobox-trigger>button svg,\.component-token-group-trigger>svg/);
});

test("Storybook conserva la matriz visual canónica de controles", () => {
  assert.match(uiStories, /export const ContratoVisualDeControles/);
  assert.match(uiStories, /data-lab-theme="light"/);
  assert.match(uiStories, /data-lab-theme="dark"/);
  assert.match(uiStories, /checked="indeterminate"/);
  assert.match(uiStories, /<Switch checked[^>]+disabled/);
  assert.match(uiStories, /<ProjectMenu/);
  assert.match(uiStories, /<ExportMenu/);
  assert.match(uiStories, /<HealthIndicator/);
});
