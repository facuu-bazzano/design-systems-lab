import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const ui = readFileSync(new URL("../app/components/ui/LabUI.tsx", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../app/components/Catalog.tsx", import.meta.url), "utf8");
const health = readFileSync(new URL("../app/components/HealthView.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const figmaMcp = readFileSync(new URL("../app/lib/figma-mcp.ts", import.meta.url), "utf8");

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

test("Salud conserva un único main y etiqueta escenarios", () => {
  assert.doesNotMatch(health, /<main[> ]/);
  assert.match(health, /<article className=\{`health-scenario/);
  assert.match(health, /aria-labelledby=\{titleId\}/);
  assert.match(health, /className="scenario-body"/);
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
